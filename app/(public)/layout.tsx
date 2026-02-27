import type { ReactNode } from "react"
import { siteAssetsBucketName } from "@/lib/constants"
import SidebarNavDesktop from "@/components/public/shared/SidebarNavDesktop"
import SidebarNavMobile from "@/components/public/shared/SidebarNavMobile"
import { supabaseServer } from "@/lib/server"

const navLinks = [
  { href: "/works", label: "works" },
  { href: "/about", label: "About" },
  { href: "/texts", label: "Text" },
]

const normalizeSlug = (value?: string | null) => (value ?? "").trim()

type SidebarWorkItem = {
  slug: string
  href: string
  key: string
  title: string
}

function buildSidebarWorkItems(
  orderRows: { entity_type: string; entity_id: string }[],
  worksById: Map<string, { slug?: string | null; title?: string | null }>,
  exhibitionsById: Map<string, { slug?: string | null; title?: string | null }>,
): SidebarWorkItem[] {
  const seen = new Set<string>()
  return orderRows
    .map((row) => {
      const meta =
        row.entity_type === "work"
          ? worksById.get(row.entity_id)
          : exhibitionsById.get(row.entity_id)
      const slug = normalizeSlug(meta?.slug)
      if (!slug) return null
      if (seen.has(slug)) return null
      seen.add(slug)
      const href =
        row.entity_type === "work" ? `/works/${slug}` : `/exhibitions/${slug}`
      const key = `${row.entity_type}-${slug}`
      const title = (meta?.title ?? "").trim() || slug.replace(/-/g, " ")
      return { slug, href, key, title }
    })
    .filter((item): item is SidebarWorkItem => Boolean(item))
}

export default async function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await supabaseServer()
  const [orderResult, heroResult] = await Promise.all([
    supabase
      .from("unified_work_order")
      .select("entity_type, entity_id")
      .order("display_order", { ascending: true }),
    supabase
      .from("hero_image")
      .select("storage_path")
      .eq("singleton_id", true)
      .maybeSingle(),
  ])

  const { data: orderRows, error: orderError } = orderResult
  if (orderError) {
    console.error("Failed to load unified order", { error: orderError })
  }

  let heroImageUrl: string | null = null
  if (heroResult.data?.storage_path) {
    const { data } = supabase.storage
      .from(siteAssetsBucketName)
      .getPublicUrl(heroResult.data.storage_path)
    heroImageUrl = data?.publicUrl ?? null
  }

  const workIds =
    orderRows
      ?.filter((r) => r.entity_type === "work")
      .map((r) => r.entity_id) ?? []
  const exhibitionIds =
    orderRows
      ?.filter((r) => r.entity_type === "exhibition")
      .map((r) => r.entity_id) ?? []

  const [worksResult, exhibitionsResult] = await Promise.all([
    workIds.length > 0
      ? supabase.from("artworks").select("id, slug, title").in("id", workIds)
      : { data: [] },
    exhibitionIds.length > 0
      ? supabase
          .from("exhibitions")
          .select("id, slug, title")
          .in("id", exhibitionIds)
      : { data: [] },
  ])

  const worksById = new Map((worksResult.data ?? []).map((w) => [w.id, w]))
  const exhibitionsById = new Map(
    (exhibitionsResult.data ?? []).map((e) => [e.id, e]),
  )

  const sidebarWorkItems = buildSidebarWorkItems(
    orderRows ?? [],
    worksById,
    exhibitionsById,
  )
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="flex w-full flex-col md:sticky md:top-0 md:h-screen md:w-2xs xl:w-xs md:shrink-0 md:overflow-y-auto">
        <SidebarNavDesktop
          sidebarWorkItems={sidebarWorkItems}
          navLinks={navLinks}
        />
        <SidebarNavMobile
          sidebarWorkItems={sidebarWorkItems}
          navLinks={navLinks}
          heroImageUrl={heroImageUrl}
        />
      </div>
      <main className="flex-auto md:w-auto">
        <div className="md:mt-22 mt-0">{children}</div>
      </main>
    </div>
  )
}
// px-6 mb-32 mt-6 md:py-0 md:pr-8

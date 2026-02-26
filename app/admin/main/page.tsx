import AdminMainImagePreviewPanel from "@/components/admin/main/AdminMainImagePreviewPanel"
import { siteAssetsBucketName } from "@/lib/constants"
import { supabaseServer } from "@/lib/server"

export type HeroArtworkOption = {
  id: string
  slug: string
  title: string
  imageUrl: string
}

export default async function AdminMainPage() {
  const supabase = await supabaseServer()
  const bucketName = siteAssetsBucketName

  const { data: heroArtwork, error: heroError } = await supabase
    .from("artworks")
    .select("id")
    .eq("category", "works")
    .eq("is_hero", true)
    .maybeSingle()

  if (heroError) {
    console.error("Failed to load hero artwork", { error: heroError })
  }

  const { data: artworks, error: artworksError } = await supabase
    .from("artworks")
    .select("id, slug, title")
    .eq("category", "works")
    .order("display_order", { ascending: false })

  if (artworksError) {
    console.error("Failed to load artworks for hero selection", {
      error: artworksError,
    })
  }

  const artworkIds = (artworks ?? []).map((a) => a.id).filter(Boolean)
  const idsToFetch = artworkIds.length > 0 ? artworkIds : []

  const { data: primaryImages } = await supabase
    .from("artwork_images")
    .select("artwork_id, storage_path")
    .in("artwork_id", idsToFetch)
    .eq("is_primary", true)

  const primaryByArtworkId = new Map(
    (primaryImages ?? []).map((img) => [img.artwork_id, img]),
  )

  const options: HeroArtworkOption[] = (artworks ?? [])
    .map((artwork) => {
      const primary = primaryByArtworkId.get(artwork.id)
      if (!primary?.storage_path) return null
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(primary.storage_path)
      if (!data?.publicUrl) return null
      return {
        id: artwork.id,
        slug: artwork.slug ?? "",
        title: artwork.title ?? artwork.slug ?? "",
        imageUrl: data.publicUrl,
      }
    })
    .filter((item): item is HeroArtworkOption => Boolean(item))

  const heroOption = heroArtwork
    ? options.find((o) => o.id === heroArtwork.id) ?? null
    : null

  return (
    <div>
      <AdminMainImagePreviewPanel
        heroImageUrl={heroOption?.imageUrl ?? null}
        heroArtworkId={heroOption?.id ?? null}
        artworkOptions={options}
      />
    </div>
  )
}

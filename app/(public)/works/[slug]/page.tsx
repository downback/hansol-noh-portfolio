import ArtworkList from "@/components/public/ArtworkList"
import { siteAssetsBucketName } from "@/lib/constants"
import { supabaseServer } from "@/lib/server"

type WorkBySlugPageProps = {
  params: Promise<{ slug: string }>
}

const formatSlug = (slug: string) => slug.replace(/-/g, " ")
const bucketName = siteAssetsBucketName

export default async function WorkBySlugPage({ params }: WorkBySlugPageProps) {
  const { slug } = await params
  const supabase = await supabaseServer()
  const { data: artwork, error: artworkError } = await supabase
    .from("artworks")
    .select("id, title, slug")
    .eq("category", "works")
    .eq("slug", slug)
    .maybeSingle()

  if (artworkError) {
    console.error("Failed to load work", { slug, error: artworkError })
  }

  const { data: imageRows, error: imagesError } = await supabase
    .from("artwork_images")
    .select("id, storage_path, caption, display_order, is_primary")
    .eq("artwork_id", artwork?.id ?? "")
    .order("display_order", { ascending: true })

  if (imagesError) {
    console.error("Failed to load work images", { slug, error: imagesError })
  }

  const images =
    imageRows
      ?.map((row) => {
        if (!row.storage_path) return null
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(row.storage_path)
        if (!publicData?.publicUrl) return null
        return {
          id: row.id,
          src: publicData.publicUrl,
          alt: row.caption ?? "Work image",
          caption: row.caption ?? "",
          isPrimary: row.is_primary ?? false,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? []

  const mainImage = images.find((image) => image.isPrimary) ?? images[0]
  const detailImages = images.filter((image) => image.id !== mainImage?.id)
  const fallbackTitle = formatSlug(slug)
  const workTitle = artwork?.title ?? fallbackTitle

  const items = mainImage
    ? [
        {
          id: `work-${slug}`,
          mainImageSrc: mainImage.src,
          mainImageAlt: mainImage.alt,
          title: workTitle,
          caption: mainImage.alt,
          detailImages: detailImages.map((image) => ({
            id: image.id,
            src: image.src,
            alt: image.alt,
            caption: image.caption,
          })),
        },
      ]
    : []

  return (
    <div className="space-y-4 px-6 mt-0 md:mt-30">
      <ArtworkList items={items} />
      <footer className="text-right text-[11px] md:text-xs text-black/20 mt-42 md:mt-30 mb-6">
        <p>© {new Date().getFullYear()} Hansol Noh. All rights reserved.</p>
      </footer>
    </div>
  )
}

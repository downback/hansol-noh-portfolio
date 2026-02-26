import Image from "next/image"
import { siteAssetsBucketName } from "@/lib/constants"
import { supabaseServer } from "@/lib/server"

const bucketName = siteAssetsBucketName

export default async function Hero() {
  const supabase = await supabaseServer()

  const { data: heroArtwork, error: heroError } = await supabase
    .from("artworks")
    .select("id")
    .eq("category", "works")
    .eq("is_hero", true)
    .maybeSingle()

  if (heroError) {
    console.error("Failed to load hero artwork", { error: heroError })
  }

  let heroImageUrl: string | null = null

  if (heroArtwork?.id) {
    const { data: primaryImage } = await supabase
      .from("artwork_images")
      .select("storage_path")
      .eq("artwork_id", heroArtwork.id)
      .eq("is_primary", true)
      .maybeSingle()

    if (primaryImage?.storage_path) {
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(primaryImage.storage_path)
      heroImageUrl = data?.publicUrl ?? null
    }
  }

  return (
    <div className="fixed inset-0 md:relative -z-10 h-screen max-h-screen overflow-hidden">
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center justify-center w-[80vw] max-h-[70vh] md:w-auto md:max-h-[70vh]">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt="Hero image"
              width={1920}
              height={1080}
              className="max-h-[70vh] w-auto object-contain"
              priority
              sizes="(max-width: 768px) 80vw, 70vh"
            />
          ) : (
            <div className="flex h-[60vh] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
              No hero image available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

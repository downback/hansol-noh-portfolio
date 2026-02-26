import Image from "next/image"
import { siteAssetsBucketName } from "@/lib/constants"
import { supabaseServer } from "@/lib/server"

const bucketName = siteAssetsBucketName

export default async function Hero() {
  const supabase = await supabaseServer()

  const { data: heroRow, error: heroError } = await supabase
    .from("hero_image")
    .select("storage_path, caption")
    .eq("singleton_id", true)
    .maybeSingle()

  if (heroError) {
    console.error("Failed to load hero image", { error: heroError })
  }

  let heroImageUrl: string | null = null
  const heroCaption = heroRow?.caption?.trim() || null
  if (heroRow?.storage_path) {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(heroRow.storage_path)
    heroImageUrl = data?.publicUrl ?? null
  }

  return (
    <div className="fixed inset-0 md:relative -z-10 h-screen max-h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col items-center justify-center">
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
        {heroCaption ? (
          <p className="mt-4 text-center text-xs sm:text-sm font-light text-muted-foreground">
            {heroCaption}
          </p>
        ) : null}
      </div>
    </div>
  )
}

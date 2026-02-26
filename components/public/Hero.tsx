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

  if (!heroImageUrl) {
    return null
  }

  return (
    <div className="fixed inset-0 md:relative -z-10 h-screen max-h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="hidden md:flex md:max-h-[75vh] md:w-auto flex-col items-end justify-center">
          <Image
            src={heroImageUrl}
            alt="Hero image"
            width={1920}
            height={1080}
            className="md:max-h-[75vh] md:w-auto object-contain"
            priority
            sizes="(max-width: 1920px) 80vw, 75vh"
          />
          {heroCaption ? (
            <p className="mt-4 w-full text-right text-sm font-light md:text-[12px] ml-auto">
              {heroCaption}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

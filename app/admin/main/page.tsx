import AdminMainImagePreviewPanel from "@/components/admin/main/AdminMainImagePreviewPanel"
import { siteAssetsBucketName } from "@/lib/constants"
import { supabaseServer } from "@/lib/server"

export default async function AdminMainPage() {
  const supabase = await supabaseServer()
  const bucketName = siteAssetsBucketName

  const { data: heroRow, error: heroError } = await supabase
    .from("hero_image")
    .select("storage_path, caption")
    .eq("singleton_id", true)
    .maybeSingle()

  if (heroError) {
    console.error("Failed to load hero image", { error: heroError })
  }

  let heroImageUrl: string | null = null
  if (heroRow?.storage_path) {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(heroRow.storage_path)
    heroImageUrl = data?.publicUrl ?? null
  }

  return (
    <div>
      <AdminMainImagePreviewPanel
        heroImageUrl={heroImageUrl}
        heroCaption={heroRow?.caption ?? null}
      />
    </div>
  )
}

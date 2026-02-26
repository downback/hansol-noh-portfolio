import { NextResponse } from "next/server"
import { siteAssetsBucketName } from "@/lib/constants"
import {
  createMappedSupabaseErrorResponse,
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import {
  removeStoragePathsSafely,
  uploadStorageFile,
} from "@/lib/server/storageTransaction"
import { supabaseServer } from "@/lib/server"
import { buildStoragePathWithPrefix } from "@/lib/storage"
import { validateImageUploadFile } from "@/lib/uploadValidation"

const bucketName = siteAssetsBucketName

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const caption = formData.get("caption")?.toString().trim() ?? ""

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing image file." },
        { status: 400 },
      )
    }

    const fileValidationError = validateImageUploadFile(file)
    if (fileValidationError) {
      return NextResponse.json({ error: fileValidationError }, { status: 400 })
    }

    const storagePath = buildStoragePathWithPrefix({
      prefix: "hero",
      file,
    })

    const { error: uploadError } = await uploadStorageFile({
      supabase,
      bucketName,
      storagePath,
      file,
    })

    if (uploadError) {
      console.error("Hero image upload failed", { error: uploadError })
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 500 },
      )
    }

    const { data: existing } = await supabase
      .from("hero_image")
      .select("storage_path")
      .eq("singleton_id", true)
      .maybeSingle()

    if (existing?.storage_path) {
      const { error: updateError } = await supabase
        .from("hero_image")
        .update({ storage_path: storagePath, caption: caption || null })
        .eq("singleton_id", true)

      if (updateError) {
        await removeStoragePathsSafely({
          supabase,
          bucketName,
          storagePaths: [storagePath],
          logContext: "Hero upload rollback",
        })
        return createMappedSupabaseErrorResponse({
          message: updateError.message,
          tableHint: "hero_image",
          fallbackMessage: "Unable to save hero image.",
        })
      }

      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [existing.storage_path],
        logContext: "Hero old image cleanup",
      })
    } else {
      const { error: insertError } = await supabase
        .from("hero_image")
        .insert({
          singleton_id: true,
          storage_path: storagePath,
          caption: caption || null,
        })

      if (insertError) {
        await removeStoragePathsSafely({
          supabase,
          bucketName,
          storagePaths: [storagePath],
          logContext: "Hero upload rollback",
        })
        return createMappedSupabaseErrorResponse({
          message: insertError.message,
          tableHint: "hero_image",
          fallbackMessage: "Unable to save hero image.",
        })
      }
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      publicUrl: data?.publicUrl ?? null,
    })
  } catch (error) {
    console.error("Hero image upload failed", { error })
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    )
  }
}

type PatchBody = { caption?: string | null }

export async function PATCH(request: Request) {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: body, errorResponse: parseError } =
      await parseJsonBody<PatchBody>(request)
    if (parseError) {
      return parseError
    }

    const caption = body?.caption ?? null
    const normalizedCaption =
      typeof caption === "string" ? caption.trim() || null : null

    const { data: existing } = await supabase
      .from("hero_image")
      .select("singleton_id")
      .eq("singleton_id", true)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json(
        { error: "No hero image to update. Upload an image first." },
        { status: 404 },
      )
    }

    const { error: updateError } = await supabase
      .from("hero_image")
      .update({ caption: normalizedCaption })
      .eq("singleton_id", true)

    if (updateError) {
      return createMappedSupabaseErrorResponse({
        message: updateError.message,
        tableHint: "hero_image",
        fallbackMessage: "Unable to update hero caption.",
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Hero caption update failed", { error })
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: existing, error: fetchError } = await supabase
      .from("hero_image")
      .select("storage_path")
      .eq("singleton_id", true)
      .maybeSingle()

    if (fetchError) {
      return createMappedSupabaseErrorResponse({
        message: fetchError.message,
        tableHint: "hero_image",
        fallbackMessage: "Unable to clear hero image.",
      })
    }

    if (existing?.storage_path) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [existing.storage_path],
        logContext: "Hero image delete",
      })
    }

    const { error: deleteError } = await supabase
      .from("hero_image")
      .delete()
      .eq("singleton_id", true)

    if (deleteError) {
      return createMappedSupabaseErrorResponse({
        message: deleteError.message,
        tableHint: "hero_image",
        fallbackMessage: "Unable to clear hero image.",
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Hero image delete failed", { error })
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    )
  }
}

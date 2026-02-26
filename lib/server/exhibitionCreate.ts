import { type ExhibitionCategory } from "@/lib/constants"
import { buildStoragePathWithPrefix } from "@/lib/storage"
import {
  mapSupabaseErrorMessage,
  type ServerSupabaseClient,
} from "@/lib/server/adminRoute"
import {
  removeStoragePathsSafely,
  uploadStorageFile,
  uploadStorageFilesWithRollback,
} from "@/lib/server/storageTransaction"
import {
  getNextDisplayOrder,
  insertUnifiedWorkOrder,
} from "@/lib/server/unifiedWorkOrder"

type ExecuteExhibitionCreateFlowInput = {
  supabase: ServerSupabaseClient
  bucketName: string
  category: ExhibitionCategory
  slug: string
  exhibitionTitle: string
  caption: string
  description?: string
  mainFile: File
  additionalFiles: File[]
}

type ExecuteExhibitionCreateFlowResult =
  | { ok: true; imageId: string; createdAt: string | null }
  | { ok: false; status: 500; error: string }

export const executeExhibitionCreateFlow = async ({
  supabase,
  bucketName,
  category,
  slug,
  exhibitionTitle,
  caption,
  description,
  mainFile,
  additionalFiles,
}: ExecuteExhibitionCreateFlowInput): Promise<ExecuteExhibitionCreateFlowResult> => {
  const exhibitionType = category === "solo-exhibitions" ? "solo" : "group"

  const { data: existingExhibition, error: existingError } = await supabase
    .from("exhibitions")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (existingError) {
    return {
      ok: false,
      status: 500,
      error: mapSupabaseErrorMessage({
        message: existingError.message,
        tableHint: "exhibitions",
        fallbackMessage: "Unable to save exhibition entry.",
      }),
    }
  }

  let exhibitionId = existingExhibition?.id ?? null
  if (!exhibitionId) {
    let nextDisplayOrder: number
    try {
      nextDisplayOrder = await getNextDisplayOrder(supabase)
    } catch (orderError) {
      return {
        ok: false,
        status: 500,
        error: mapSupabaseErrorMessage({
          message:
            orderError instanceof Error ? orderError.message : "Order lookup failed",
          tableHint: "unified_work_order",
          fallbackMessage: "Unable to save exhibition entry.",
        }),
      }
    }

    const { data: insertedExhibition, error: insertError } = await supabase
      .from("exhibitions")
      .insert({
        type: exhibitionType,
        title: exhibitionTitle,
        slug,
        description: description || null,
      })
      .select("id")
      .single()

    if (insertError || !insertedExhibition) {
      return {
        ok: false,
        status: 500,
        error: mapSupabaseErrorMessage({
          message: insertError?.message || "",
          tableHint: "exhibitions",
          fallbackMessage: "Unable to save exhibition entry.",
        }),
      }
    }
    exhibitionId = insertedExhibition.id

    try {
      await insertUnifiedWorkOrder(
        supabase,
        "exhibition",
        exhibitionId,
        nextDisplayOrder,
      )
    } catch (orderInsertError) {
      await supabase.from("exhibitions").delete().eq("id", exhibitionId)
      return {
        ok: false,
        status: 500,
        error: mapSupabaseErrorMessage({
          message:
            orderInsertError instanceof Error
              ? orderInsertError.message
              : "Order insert failed",
          tableHint: "unified_work_order",
          fallbackMessage: "Unable to save exhibition entry.",
        }),
      }
    }
  } else {
    const { error: updateError } = await supabase
      .from("exhibitions")
      .update({
        type: exhibitionType,
        title: exhibitionTitle,
        description: description || null,
      })
      .eq("id", exhibitionId)

    if (updateError) {
      return {
        ok: false,
        status: 500,
        error: mapSupabaseErrorMessage({
          message: updateError.message,
          tableHint: "exhibitions",
          fallbackMessage: "Unable to save exhibition entry.",
        }),
      }
    }
  }

  const { data: latestImage, error: latestImageError } = await supabase
    .from("exhibition_images")
    .select("display_order")
    .eq("exhibition_id", exhibitionId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestImageError) {
    return {
      ok: false,
      status: 500,
      error: mapSupabaseErrorMessage({
        message: latestImageError.message,
        tableHint: "exhibition_images",
        fallbackMessage: "Unable to save exhibition entry.",
      }),
    }
  }

  const baseDisplayOrder = (latestImage?.display_order ?? -1) + 1

  const { error: primaryResetError } = await supabase
    .from("exhibition_images")
    .update({ is_primary: false })
    .eq("exhibition_id", exhibitionId)

  if (primaryResetError) {
    return {
      ok: false,
      status: 500,
      error: mapSupabaseErrorMessage({
        message: primaryResetError.message,
        tableHint: "exhibition_images",
        fallbackMessage: "Unable to save exhibition entry.",
      }),
    }
  }

  const storagePath = buildStoragePathWithPrefix({
    prefix: `${category}/${slug}`,
    file: mainFile,
  })
  const { error: uploadError } = await uploadStorageFile({
    supabase,
    bucketName,
    storagePath,
    file: mainFile,
  })

  if (uploadError) {
    console.error("Exhibition main upload failed", {
      message: uploadError.message,
    })
    return {
      ok: false,
      status: 500,
      error: uploadError.message || "Upload failed. Please try again.",
    }
  }

  const { data: imageRow, error: imageError } = await supabase
    .from("exhibition_images")
    .insert({
      exhibition_id: exhibitionId,
      storage_path: storagePath,
      caption,
      display_order: baseDisplayOrder,
      is_primary: true,
    })
    .select("id, created_at")
    .single()

  if (imageError || !imageRow) {
    await removeStoragePathsSafely({
      supabase,
      bucketName,
      storagePaths: [storagePath],
      logContext: "Exhibition create main image rollback",
    })
    return {
      ok: false,
      status: 500,
      error: mapSupabaseErrorMessage({
        message: imageError?.message || "",
        tableHint: "exhibition_images",
        fallbackMessage: "Unable to save exhibition entry.",
      }),
    }
  }

  if (additionalFiles.length > 0) {
    const additionalUploadItems = additionalFiles.map((additional, index) => ({
      file: additional,
      storagePath: buildStoragePathWithPrefix({
        prefix: `${category}/${slug}`,
        file: additional,
      }),
      displayOrder: baseDisplayOrder + index + 1,
    }))

    const { error: additionalUploadError } = await uploadStorageFilesWithRollback({
      supabase,
      bucketName,
      items: additionalUploadItems.map((item) => ({
        storagePath: item.storagePath,
        file: item.file,
      })),
      logContext: "Exhibition create additional images rollback",
    })

    if (additionalUploadError) {
      console.error("Exhibition additional upload failed", {
        message: additionalUploadError.message,
      })
      return {
        ok: false,
        status: 500,
        error: additionalUploadError.message || "Upload failed. Please try again.",
      }
    }

    const inserts = additionalUploadItems.map((item) => ({
      exhibition_id: exhibitionId,
      storage_path: item.storagePath,
      caption,
      display_order: item.displayOrder,
      is_primary: false,
    }))

    const { error: additionalInsertError } = await supabase
      .from("exhibition_images")
      .insert(inserts)

    if (additionalInsertError) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: additionalUploadItems.map((item) => item.storagePath),
        logContext: "Exhibition create additional insert rollback",
      })
      console.error("Exhibition additional insert failed", {
        message: additionalInsertError.message,
      })
      return {
        ok: false,
        status: 500,
        error: mapSupabaseErrorMessage({
          message: additionalInsertError.message,
          tableHint: "exhibition_images",
          fallbackMessage: "Unable to save exhibition entry.",
        }),
      }
    }
  }

  return { ok: true, imageId: imageRow.id, createdAt: imageRow.created_at }
}

import { buildStoragePathWithPrefix } from "@/lib/storage"
import type { ServerSupabaseClient } from "@/lib/server/adminRoute"
import {
  removeStoragePathsSafely,
  uploadStorageFilesWithRollback,
} from "@/lib/server/storageTransaction"

type InsertAdditionalWorkImagesInput = {
  supabase: ServerSupabaseClient
  bucketName: string
  artworkId: string
  slug: string
  captions?: string[]
  additionalFiles: File[]
  startDisplayOrder: number
  displayOrders?: number[]
}

type InsertAdditionalWorkImagesResult =
  | { errorMessage: null }
  | { errorMessage: string }

export const insertAdditionalWorkImages = async ({
  supabase,
  bucketName,
  artworkId,
  slug,
  captions = [],
  additionalFiles,
  startDisplayOrder,
  displayOrders,
}: InsertAdditionalWorkImagesInput): Promise<InsertAdditionalWorkImagesResult> => {
  if (additionalFiles.length === 0) {
    return { errorMessage: null }
  }

  if (displayOrders && displayOrders.length !== additionalFiles.length) {
    return { errorMessage: "Invalid additional image order." }
  }

  const prefix = `works/${slug}`
  const additionalUploadItems = additionalFiles.map((additional, index) => ({
    file: additional,
    storagePath: buildStoragePathWithPrefix({
      prefix,
      file: additional,
    }),
    displayOrder: displayOrders?.[index] ?? startDisplayOrder + index,
  }))

  const { error: additionalUploadError } = await uploadStorageFilesWithRollback({
    supabase,
    bucketName,
    items: additionalUploadItems.map((item) => ({
      storagePath: item.storagePath,
      file: item.file,
    })),
    logContext: "Work create additional images rollback",
  })

  if (additionalUploadError) {
    return {
      errorMessage:
        additionalUploadError.message || "Upload failed. Please try again.",
    }
  }

  const inserts = additionalUploadItems.map((item, index) => ({
    artwork_id: artworkId,
    storage_path: item.storagePath,
    caption: captions[index]?.trim() || null,
    display_order: item.displayOrder,
    is_primary: false,
  }))

  const { error: additionalInsertError } = await supabase
    .from("artwork_images")
    .insert(inserts)

  if (additionalInsertError) {
    await removeStoragePathsSafely({
      supabase,
      bucketName,
      storagePaths: additionalUploadItems.map((item) => item.storagePath),
      logContext: "Work create additional insert rollback",
    })
    return { errorMessage: additionalInsertError.message }
  }

  return { errorMessage: null }
}

type RemoveAdditionalWorkImagesInput = {
  supabase: ServerSupabaseClient
  bucketName: string
  artworkId: string
  removedAdditionalImageIds: string[]
}

type UpdateAdditionalWorkImageCaptionsInput = {
  supabase: ServerSupabaseClient
  artworkId: string
  imageUpdates: { id: string; caption: string; displayOrder: number }[]
}

type UpdateAdditionalWorkImageCaptionsResult =
  | { errorMessage: null; status: 200 }
  | { errorMessage: string; status: 400 | 500 }

export const updateAdditionalWorkImageCaptions = async ({
  supabase,
  artworkId,
  imageUpdates,
}: UpdateAdditionalWorkImageCaptionsInput): Promise<UpdateAdditionalWorkImageCaptionsResult> => {
  if (imageUpdates.length === 0) {
    return { errorMessage: null, status: 200 }
  }

  const imageIds = imageUpdates.map((item) => item.id)
  const { data: rows, error } = await supabase
    .from("artwork_images")
    .select("id, is_primary")
    .eq("artwork_id", artworkId)
    .in("id", imageIds)

  if (error) {
    return {
      errorMessage: error.message || "Unable to update additional image captions.",
      status: 500,
    }
  }

  if ((rows ?? []).some((row) => row.is_primary)) {
    return {
      errorMessage: "Primary image caption must be updated separately.",
      status: 400,
    }
  }

  if ((rows ?? []).length !== imageIds.length) {
    return {
      errorMessage: "Some additional images could not be found.",
      status: 400,
    }
  }

  for (const item of imageUpdates) {
    const { error: updateError } = await supabase
      .from("artwork_images")
      .update({
        caption: item.caption.trim() || null,
        display_order: item.displayOrder,
      })
      .eq("id", item.id)
      .eq("artwork_id", artworkId)
      .eq("is_primary", false)

    if (updateError) {
      return {
        errorMessage:
          updateError.message || "Unable to update additional image captions.",
        status: 500,
      }
    }
  }

  return { errorMessage: null, status: 200 }
}

type RemoveAdditionalWorkImagesResult =
  | { errorMessage: null; status: 200 }
  | { errorMessage: string; status: 400 | 500 }

export const removeAdditionalWorkImages = async ({
  supabase,
  bucketName,
  artworkId,
  removedAdditionalImageIds,
}: RemoveAdditionalWorkImagesInput): Promise<RemoveAdditionalWorkImagesResult> => {
  if (removedAdditionalImageIds.length === 0) {
    return { errorMessage: null, status: 200 }
  }

  const { data: removableRows, error: removableRowsError } = await supabase
    .from("artwork_images")
    .select("id, storage_path, is_primary")
    .eq("artwork_id", artworkId)
    .in("id", removedAdditionalImageIds)

  if (removableRowsError) {
    return {
      errorMessage: removableRowsError.message || "Unable to delete images.",
      status: 500,
    }
  }

  if ((removableRows ?? []).some((row) => row.is_primary)) {
    return {
      errorMessage: "Primary image cannot be deleted in this operation.",
      status: 400,
    }
  }

  const removableIds = (removableRows ?? []).map((row) => row.id)
  if (removableIds.length === 0) {
    return { errorMessage: null, status: 200 }
  }

  const { error: removeDbError } = await supabase
    .from("artwork_images")
    .delete()
    .in("id", removableIds)

  if (removeDbError) {
    return {
      errorMessage: removeDbError.message || "Unable to delete images.",
      status: 500,
    }
  }

  const storagePaths = (removableRows ?? [])
    .map((row) => row.storage_path)
    .filter((value): value is string => Boolean(value))

  await removeStoragePathsSafely({
    supabase,
    bucketName,
    storagePaths,
    logContext: "Work update removed additional cleanup",
  })

  return { errorMessage: null, status: 200 }
}

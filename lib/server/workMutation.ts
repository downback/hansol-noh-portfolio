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
  caption: string
  additionalFiles: File[]
  startDisplayOrder: number
}

type InsertAdditionalWorkImagesResult =
  | { errorMessage: null }
  | { errorMessage: string }

export const insertAdditionalWorkImages = async ({
  supabase,
  bucketName,
  artworkId,
  slug,
  caption,
  additionalFiles,
  startDisplayOrder,
}: InsertAdditionalWorkImagesInput): Promise<InsertAdditionalWorkImagesResult> => {
  if (additionalFiles.length === 0) {
    return { errorMessage: null }
  }

  const prefix = `works/${slug}`
  const additionalUploadItems = additionalFiles.map((additional, index) => ({
    file: additional,
    storagePath: buildStoragePathWithPrefix({
      prefix,
      file: additional,
    }),
    displayOrder: startDisplayOrder + index,
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

  const inserts = additionalUploadItems.map((item) => ({
    artwork_id: artworkId,
    storage_path: item.storagePath,
    caption,
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

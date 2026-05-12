import { NextResponse } from "next/server"
import { siteAssetsBucketName } from "@/lib/constants"
import { buildStoragePathWithPrefix } from "@/lib/storage"
import {
  validateWorkMetadata,
  type WorkMetadataValidationData,
} from "@/lib/requestValidation"
import {
  createMappedSupabaseErrorResponse,
  insertActivityLog,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import {
  removeStoragePathsSafely,
  uploadStorageFile,
} from "@/lib/server/storageTransaction"
import {
  getNextDisplayOrder,
  insertUnifiedWorkOrder,
} from "@/lib/server/unifiedWorkOrder"
import { insertAdditionalWorkImages } from "@/lib/server/workMutation"
import { supabaseServer } from "@/lib/server"
import { validateImageUploadFile } from "@/lib/uploadValidation"

const bucketName = siteAssetsBucketName

const parseCaptionList = (value: FormDataEntryValue | null, expected: number) => {
  if (typeof value !== "string" || !value.trim()) {
    return Array.from({ length: expected }, () => "")
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }
    return Array.from({ length: expected }, (_, index) =>
      typeof parsed[index] === "string" ? parsed[index] : "",
    )
  } catch {
    return null
  }
}

const parseStringList = (value: FormDataEntryValue | null, expected?: number) => {
  if (typeof value !== "string" || !value.trim()) {
    return expected === undefined ? [] : Array.from({ length: expected }, () => "")
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
      return null
    }
    if (expected !== undefined && parsed.length !== expected) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const getNewAdditionalImageDisplayOrders = ({
  additionalImageClientIds,
  additionalImageOrder,
}: {
  additionalImageClientIds: string[]
  additionalImageOrder: string[]
}) => {
  const fallbackOrder = additionalImageClientIds.map((item) => `new:${item}`)
  const resolvedOrder =
    additionalImageOrder.length > 0 ? additionalImageOrder : fallbackOrder
  const expectedItems = new Set(fallbackOrder)

  if (
    resolvedOrder.length !== expectedItems.size ||
    resolvedOrder.some((item) => !expectedItems.has(item)) ||
    new Set(resolvedOrder).size !== expectedItems.size
  ) {
    return null
  }

  return additionalImageClientIds.map((clientId) => {
    const orderToken = `new:${clientId}`
    return resolvedOrder.indexOf(orderToken) + 1
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const yearRaw = formData.get("year")?.toString().trim()
    const slug = formData.get("slug")?.toString().trim()
    const title = formData.get("title")?.toString().trim()
    const caption = formData.get("caption")?.toString().trim()
    const additionalFiles = formData
      .getAll("additional_images")
      .filter((value): value is File => value instanceof File)
    const additionalCaptions = parseCaptionList(
      formData.get("additional_image_captions"),
      additionalFiles.length,
    )
    const additionalImageClientIds = parseStringList(
      formData.get("additional_image_client_ids"),
      additionalFiles.length,
    )
    const additionalImageOrder = parseStringList(
      formData.get("additional_image_order"),
    )

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing image file." },
        { status: 400 },
      )
    }

    if (!additionalCaptions) {
      return NextResponse.json(
        { error: "Invalid additional image captions." },
        { status: 400 },
      )
    }

    if (!additionalImageClientIds) {
      return NextResponse.json(
        { error: "Invalid additional image client ids." },
        { status: 400 },
      )
    }

    if (!additionalImageOrder) {
      return NextResponse.json(
        { error: "Invalid additional image order." },
        { status: 400 },
      )
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Simple title (slug) is required." },
        { status: 400 },
      )
    }

    const fileValidationError = validateImageUploadFile(file)
    if (fileValidationError) {
      return NextResponse.json({ error: fileValidationError }, { status: 400 })
    }

    const invalidAdditionalImage = additionalFiles.find(
      (additional) => validateImageUploadFile(additional) !== null,
    )
    if (invalidAdditionalImage) {
      const additionalValidationError = validateImageUploadFile(
        invalidAdditionalImage,
      )
      return NextResponse.json(
        {
          error:
            additionalValidationError || "Only image uploads are allowed.",
        },
        { status: 400 },
      )
    }

    const metadataValidationResult = validateWorkMetadata({
      yearRaw: yearRaw ?? "",
      slug,
      title: title ?? "",
      caption: caption ?? "",
    })
    if (
      !metadataValidationResult.data ||
      metadataValidationResult.errorMessage
    ) {
      return NextResponse.json(
        {
          error:
            metadataValidationResult.errorMessage || "Invalid request body.",
        },
        { status: 400 },
      )
    }
    const validatedData =
      metadataValidationResult.data as WorkMetadataValidationData
    const {
      year,
      slug: normalizedSlug,
      title: normalizedTitle,
      caption: normalizedCaption,
    } = validatedData

    if (!normalizedSlug) {
      return NextResponse.json(
        { error: "Simple title (slug) is required." },
        { status: 400 },
      )
    }

    const additionalImageDisplayOrders = getNewAdditionalImageDisplayOrders({
      additionalImageClientIds,
      additionalImageOrder,
    })
    if (!additionalImageDisplayOrders) {
      return NextResponse.json(
        { error: "Invalid additional image order." },
        { status: 400 },
      )
    }

    const storagePath = buildStoragePathWithPrefix({
      prefix: `works/${normalizedSlug}`,
      file,
    })
    const { error: uploadError } = await uploadStorageFile({
      supabase,
      bucketName,
      storagePath,
      file,
    })

    if (uploadError) {
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 500 },
      )
    }

    let nextDisplayOrder: number
    try {
      nextDisplayOrder = await getNextDisplayOrder(supabase)
    } catch (orderError) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [storagePath],
        logContext: "Work create rollback",
      })
      return createMappedSupabaseErrorResponse({
        message:
          orderError instanceof Error ? orderError.message : "Order lookup failed",
        tableHint: "unified_work_order",
        fallbackMessage: "Unable to save work entry.",
      })
    }

    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .insert({
        category: "works",
        year,
        slug: normalizedSlug,
        title: normalizedTitle,
      })
      .select("id, created_at")
      .single()

    if (artworkError || !artwork) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [storagePath],
        logContext: "Work create rollback",
      })
      return createMappedSupabaseErrorResponse({
        message: artworkError?.message || "",
        tableHint: "artworks",
        fallbackMessage: "Unable to save work entry.",
      })
    }

    const { error: artworkImageError } = await supabase
      .from("artwork_images")
      .insert({
        artwork_id: artwork.id,
        storage_path: storagePath,
        caption: normalizedCaption,
        display_order: 0,
        is_primary: true,
      })

    if (artworkImageError) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [storagePath],
        logContext: "Work create image rollback",
      })
      await supabase.from("artworks").delete().eq("id", artwork.id)
      return createMappedSupabaseErrorResponse({
        message: artworkImageError.message,
        tableHint: "artwork_images",
        fallbackMessage: "Unable to save work entry.",
      })
    }

    try {
      await insertUnifiedWorkOrder(supabase, "work", artwork.id, nextDisplayOrder)
    } catch (orderInsertError) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [storagePath],
        logContext: "Work create unified order rollback",
      })
      await supabase.from("artwork_images").delete().eq("artwork_id", artwork.id)
      await supabase.from("artworks").delete().eq("id", artwork.id)
      return createMappedSupabaseErrorResponse({
        message:
          orderInsertError instanceof Error
            ? orderInsertError.message
            : "Order insert failed",
        tableHint: "unified_work_order",
        fallbackMessage: "Unable to save work entry.",
      })
    }

    if (additionalFiles.length > 0) {
      const additionalResult = await insertAdditionalWorkImages({
        supabase,
        bucketName,
        artworkId: artwork.id,
        slug: normalizedSlug,
        captions: additionalCaptions,
        additionalFiles,
        startDisplayOrder: 1,
        displayOrders: additionalImageDisplayOrders,
      })
      if (additionalResult.errorMessage) {
        await removeStoragePathsSafely({
          supabase,
          bucketName,
          storagePaths: [storagePath],
          logContext: "Work create additional images rollback",
        })
        await supabase.from("artworks").delete().eq("id", artwork.id)
        return NextResponse.json(
          { error: additionalResult.errorMessage },
          { status: 500 },
        )
      }
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "add",
      entityType: "artwork",
      entityId: artwork.id,
      metadata: { category: "works" },
      logContext: "Work create",
    })

    return NextResponse.json({ ok: true, createdAt: artwork.created_at })
  } catch (error) {
    console.error("Work upload failed", { error })
    return NextResponse.json(
      { error: "Server error while uploading work." },
      { status: 500 },
    )
  }
}

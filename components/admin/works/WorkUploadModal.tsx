"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import AdminDialog from "@/components/admin/shared/AdminDialog"
import SavingDotsLabel from "@/components/admin/shared/SavingDotsLabel"
import { useSingleImageInput } from "@/components/admin/shared/hooks/useSingleImageInput"
import { useModalOpenTransition } from "@/components/admin/shared/hooks/useModalOpenTransition"
import WorkAdditionalImagesEditor from "@/components/admin/works/WorkAdditionalImagesEditor"
import { useExhibitionImagePreviews } from "@/components/admin/exhibition/hooks/useExhibitionImagePreviews"
import { formatFileSize } from "@/lib/fileUpload"

type AdditionalWorkImage = {
  clientId: string
  file: File
  caption: string
}

type ExistingAdditionalWorkImage = {
  id: string
  url: string
  caption: string
}

export type WorkFormValues = {
  imageFile: File | null
  year: string
  slug: string
  title: string
  caption: string
  additionalImages: AdditionalWorkImage[]
  existingAdditionalImages: ExistingAdditionalWorkImage[]
  additionalImageOrder: string[]
  removedAdditionalImageIds?: string[]
}

type WorkUploadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onSave?: (values: WorkFormValues) => void
  yearOptions?: string[]
  isYearSelectDisabled?: boolean
  selectedYearCategory?: string
  initialValues?: {
    imageUrl?: string
    year?: string
    slug?: string
    title?: string
    caption?: string
    additionalImages?: ExistingAdditionalWorkImage[]
  }
  isEditMode?: boolean
  confirmLabel?: string
  isConfirmDisabled?: boolean
  isSubmitting?: boolean
  errorMessage?: string
}

export default function WorkUploadModal({
  open,
  onOpenChange,
  title = "Update Content",
  description = "Upload a work image and add metadata.",
  onSave,
  yearOptions = [],
  isYearSelectDisabled = false,
  selectedYearCategory,
  initialValues,
  isEditMode = false,
  confirmLabel = "Confirm change",
  isConfirmDisabled = false,
  isSubmitting = false,
  errorMessage,
}: WorkUploadModalProps) {
  const [selectedImageName, setSelectedImageName] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [initialImageUrl, setInitialImageUrl] = useState(
    initialValues?.imageUrl ?? "",
  )
  const [year, setYear] = useState(initialValues?.year ?? "")
  const [slugTitle, setSlugTitle] = useState(initialValues?.slug ?? "")
  const [titleValue, setTitleValue] = useState(initialValues?.title ?? "")
  const [caption, setCaption] = useState(initialValues?.caption ?? "")
  const [additionalImages, setAdditionalImages] = useState<AdditionalWorkImage[]>(
    [],
  )
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<
    ExistingAdditionalWorkImage[]
  >([])
  const [additionalImageOrder, setAdditionalImageOrder] = useState<string[]>([])
  const [removedAdditionalImageIds, setRemovedAdditionalImageIds] = useState<
    string[]
  >([])
  const [slugError, setSlugError] = useState("")
  const wasSubmittingRef = useRef(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState("")
  const {
    maxFileSizeBytes,
    additionalPreviewUrls,
    appendAdditionalPreviews,
    removeAdditionalPreviewAt,
    clearPreviews,
  } = useExhibitionImagePreviews()

  const showError = (message: string) => {
    setErrorDialogMessage(message)
    setErrorDialogOpen(true)
  }

  const getExistingOrderToken = (id: string) => `existing:${id}`
  const getNewOrderToken = (clientId: string) => `new:${clientId}`

  const handleRemoveAdditionalImage = (clientIdToRemove: string) => {
    setAdditionalImages((prev) => {
      const indexToRemove = prev.findIndex(
        (item) => item.clientId === clientIdToRemove,
      )
      if (indexToRemove >= 0) {
        removeAdditionalPreviewAt(indexToRemove)
      }
      return prev.filter((item) => item.clientId !== clientIdToRemove)
    })
    setAdditionalImageOrder((prev) =>
      prev.filter((item) => item !== getNewOrderToken(clientIdToRemove)),
    )
  }

  const handleAdditionalImageCaptionChange = (
    idToUpdate: string,
    nextCaption: string,
  ) => {
    setAdditionalImages((prev) =>
      prev.map((item) =>
        item.clientId === idToUpdate ? { ...item, caption: nextCaption } : item,
      ),
    )
  }

  const handleRemoveExistingAdditionalImage = (id: string) => {
    setExistingAdditionalImages((prev) => prev.filter((item) => item.id !== id))
    setAdditionalImageOrder((prev) =>
      prev.filter((item) => item !== getExistingOrderToken(id)),
    )
    setRemovedAdditionalImageIds((prev) =>
      prev.includes(id) ? prev : [...prev, id],
    )
  }

  const handleExistingAdditionalImageCaptionChange = (
    id: string,
    nextCaption: string,
  ) => {
    setExistingAdditionalImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, caption: nextCaption } : item,
      ),
    )
  }

  const moveAdditionalImage = (id: string, direction: -1 | 1) => {
    setAdditionalImageOrder((prev) => {
      const existingToken = getExistingOrderToken(id)
      const newToken = getNewOrderToken(id)
      const index = prev.findIndex(
        (item) => item === existingToken || item === newToken,
      )
      if (index < 0) return prev
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  const applyInitialValues = useCallback(() => {
    clearPreviews()
    setSelectedImageName("")
    setImageFile(null)
    setImagePreviewUrl("")
    setYear(initialValues?.year ?? "")
    setSlugTitle(initialValues?.slug ?? "")
    setTitleValue(initialValues?.title ?? "")
    setCaption(initialValues?.caption ?? "")
    setInitialImageUrl(initialValues?.imageUrl ?? "")
    const nextExistingAdditionalImages = initialValues?.additionalImages ?? []
    setExistingAdditionalImages(nextExistingAdditionalImages)
    setAdditionalImageOrder(
      nextExistingAdditionalImages.map((item) => getExistingOrderToken(item.id)),
    )
    setRemovedAdditionalImageIds([])
    setAdditionalImages([])
    setSlugError("")
  }, [clearPreviews, initialValues])

  const handleAcceptedImageFile = useCallback((file: File) => {
    setSelectedImageName(file.name)
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }, [])

  const handleOversizeImageFile = useCallback(
    (file: File, source: "drop" | "input") => {
      if (source === "input") {
        showError(
          `해당 파일의 용량이 너무 큽니다: "${file.name}" (${formatFileSize(file.size)}). 최대 용량인 ${formatFileSize(maxFileSizeBytes)} 이하의 이미지(들)로 다시 업로드 해주세요.`,
        )
        return
      }
      showError(
        `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxFileSizeBytes)}.`,
      )
    },
    [maxFileSizeBytes],
  )

  const {
    handleDragOver: handleImageDragOver,
    handleDrop: handleImageDrop,
    handleInputChange: handleImageInputChange,
  } = useSingleImageInput({
    maxFileSizeBytes,
    onFileAccepted: handleAcceptedImageFile,
    onFileOversize: handleOversizeImageFile,
  })

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  useEffect(() => {
    let resetTimeout: ReturnType<typeof setTimeout> | undefined
    if (!open) {
      wasSubmittingRef.current = false
      return
    }

    if (wasSubmittingRef.current && !isSubmitting && !errorMessage) {
      resetTimeout = setTimeout(() => {
        clearPreviews()
        setSelectedImageName("")
        setImagePreviewUrl("")
        setImageFile(null)
        setInitialImageUrl("")
        setSlugTitle("")
        setTitleValue("")
        setCaption("")
        setYear("")
        setAdditionalImages([])
        setExistingAdditionalImages([])
        setAdditionalImageOrder([])
        setRemovedAdditionalImageIds([])
        setSlugError("")
      }, 0)
    }

    wasSubmittingRef.current = isSubmitting
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout)
    }
  }, [clearPreviews, open, isSubmitting, errorMessage])

  useModalOpenTransition({ open, onOpen: applyInitialValues })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      clearPreviews()
      setSelectedImageName("")
      setImagePreviewUrl("")
      setImageFile(null)
      setInitialImageUrl("")
      setYear("")
      setSlugTitle("")
      setTitleValue("")
      setCaption("")
      setAdditionalImages([])
      setExistingAdditionalImages([])
      setAdditionalImageOrder([])
      setRemovedAdditionalImageIds([])
      setSlugError("")
    }

    onOpenChange(nextOpen)
  }

  const slugify = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return ""
    return trimmed
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^\p{L}\p{N}-]/gu, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const derivedSlug = slugify(slugTitle)

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const validateSlug = (): string | null => {
    const trimmed = derivedSlug.trim()
    if (!trimmed) {
      return "url에 들어갈 영문 타이틀을 입력해주세요."
    }
    if (!slugPattern.test(trimmed)) {
      return "영문 소문자, 숫자, 하이픈만 사용할 수 있습니다. (e.g. work1, work2025-1)."
    }
    return null
  }

  const initialYear = initialValues?.year ?? ""
  const initialTitle = initialValues?.title ?? ""
  const initialCaption = initialValues?.caption ?? ""
  const initialAdditionalImagesSerialized = JSON.stringify(
    initialValues?.additionalImages ?? [],
  )
  const existingAdditionalImagesSerialized = JSON.stringify(
    existingAdditionalImages,
  )
  const additionalImageOrderSerialized = JSON.stringify(additionalImageOrder)
  const initialAdditionalImageOrderSerialized = JSON.stringify(
    (initialValues?.additionalImages ?? []).map((item) =>
      getExistingOrderToken(item.id),
    ),
  )

  const hasChanges =
    imageFile !== null ||
    year !== initialYear ||
    titleValue !== initialTitle ||
    caption !== initialCaption ||
    existingAdditionalImagesSerialized !== initialAdditionalImagesSerialized ||
    additionalImageOrderSerialized !== initialAdditionalImageOrderSerialized ||
    additionalImages.length > 0 ||
    removedAdditionalImageIds.length > 0

  const isSaveDisabled =
    isConfirmDisabled || isSubmitting || (isEditMode && !hasChanges)

  const orderedAdditionalImageItems = additionalImageOrder.flatMap((orderItem) => {
    if (orderItem.startsWith("existing:")) {
      const id = orderItem.replace("existing:", "")
      const existingItem = existingAdditionalImages.find((item) => item.id === id)
      if (!existingItem) return []
      return [
        {
          id: existingItem.id,
          imageUrl: existingItem.url,
          caption: existingItem.caption,
          isExisting: true,
        },
      ]
    }

    const clientId = orderItem.replace("new:", "")
    const newItemIndex = additionalImages.findIndex(
      (item) => item.clientId === clientId,
    )
    const newItem = additionalImages[newItemIndex]
    if (!newItem || newItemIndex < 0) return []

    return [
      {
        id: newItem.clientId,
        imageUrl: additionalPreviewUrls[newItemIndex] ?? "",
        caption: newItem.caption,
        isExisting: false,
      },
    ]
  })

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4/5 md:max-w-lg rounded-md max-h-[70vh] md:max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-image">
                작품 메인 이미지{isEditMode ? " (optional)" : ""}
              </Label>
              <label
                htmlFor="upload-image"
                className="flex min-h-[120px] w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                onDrop={handleImageDrop}
                onDragOver={handleImageDragOver}
              >
                <span>
                  Drop image here or click to upload
                  {selectedImageName ? (
                    <span className="mt-2 block text-xs text-muted-foreground">
                      Selected: {selectedImageName}
                    </span>
                  ) : null}
                </span>
              </label>
              <Input
                id="upload-image"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="sr-only"
                onChange={handleImageInputChange}
              />
              {imagePreviewUrl || initialImageUrl ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <Image
                    src={imagePreviewUrl || initialImageUrl}
                    alt="Selected preview"
                    width={800}
                    height={400}
                    className="h-48 w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-year">
                작품 제작 연도{isYearSelectDisabled ? "" : " *"}
              </Label>
              {isYearSelectDisabled ? (
                <div
                  id="work-year"
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                >
                  {selectedYearCategory || "-"}
                </div>
              ) : (
                <Select value={year || undefined} onValueChange={setYear}>
                  <SelectTrigger id="work-year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-slug-title">
                작품 영문 타이틀(URL){isEditMode ? "" : " *"}
              </Label>
              <Input
                id="work-slug-title"
                value={slugTitle}
                onChange={(event) => {
                  setSlugTitle(event.target.value)
                  setSlugError("")
                }}
                placeholder="작업 타이틀을 입력해주세요"
                disabled={isEditMode}
              />
              {slugError ? (
                <p className="text-xs text-rose-600">{slugError}</p>
              ) : null}
              <div className="flex flex-col gap-0 text-xs text-muted-foreground">
                <div>
                  *위 타이틀은 url에 들어갈 타이틀로 영문으로 특수문자 없이
                  작성해주세요.
                </div>
                <div>
                  **영문 타이틀이 없을 경우 work1, work2025-1 등으로
                  작성해주세요.
                </div>
                <div>
                  ***최초 업로드 후 수정이 불가능 하며, 중복되는 타이틀은 사용할
                  수 없습니다.
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-title">작품 타이틀 *</Label>
              <Textarea
                id="work-title"
                value={titleValue}
                onChange={(event) => setTitleValue(event.target.value)}
                placeholder="작업 타이틀을 입력해주세요"
                className="min-h-[60px]"
              />
              <div className="text-xs text-muted-foreground">
                *작업 세부페이지에 들어갈 타이틀을 입력해주세요. 영문, 국문,
                특수문자 모두 포함 가능합니다.
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-caption">작품 캡션 *</Label>
              <Textarea
                id="work-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="작업 캡션을 입력해주세요"
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-additional-images">작품 추가 이미지</Label>
              <Input
                id="upload-additional-images"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  if (files.length === 0) return

                  const oversizedFiles = files.filter(
                    (file) => file.size > maxFileSizeBytes,
                  )
                  if (oversizedFiles.length > 0) {
                    const fileList = oversizedFiles
                      .map(
                        (file) =>
                          `"${file.name}" (${formatFileSize(file.size)})`,
                      )
                      .join(", ")
                    showError(
                      `아래 파일(들)의 용량이 너무 큽니다: ${fileList}. 최대 용량인 ${formatFileSize(maxFileSizeBytes)} 이하의 이미지(들)로 다시 업로드 해주세요.`,
                    )
                    event.target.value = ""
                    return
                  }

                  const existingKeys = new Set(
                    additionalImages.map(
                      (item) =>
                        `${item.file.name}-${item.file.size}-${item.file.lastModified}`,
                    ),
                  )
                  const newFiles = files.filter((file) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`
                    if (existingKeys.has(key)) return false
                    existingKeys.add(key)
                    return true
                  })
                  if (newFiles.length === 0) {
                    event.target.value = ""
                    return
                  }
                  const nextAdditionalImages = newFiles.map((file) => ({
                    clientId: crypto.randomUUID(),
                    file,
                    caption: "",
                  }))
                  setAdditionalImages((prev) => [
                    ...prev,
                    ...nextAdditionalImages,
                  ])
                  setAdditionalImageOrder((prev) => [
                    ...prev,
                    ...nextAdditionalImages.map((item) =>
                      getNewOrderToken(item.clientId),
                    ),
                  ])
                  appendAdditionalPreviews(newFiles)
                  event.target.value = ""
                }}
              />
              <WorkAdditionalImagesEditor
                items={orderedAdditionalImageItems}
                onRemove={(id) => {
                  const existingItem = existingAdditionalImages.find(
                    (item) => item.id === id,
                  )
                  if (existingItem) {
                    handleRemoveExistingAdditionalImage(id)
                    return
                  }
                  handleRemoveAdditionalImage(id)
                }}
                onCaptionChange={(id, nextCaption) => {
                  const existingItem = existingAdditionalImages.find(
                    (item) => item.id === id,
                  )
                  if (existingItem) {
                    handleExistingAdditionalImageCaptionChange(id, nextCaption)
                    return
                  }
                  handleAdditionalImageCaptionChange(id, nextCaption)
                }}
                onMoveUp={(id) => moveAdditionalImage(id, -1)}
                onMoveDown={(id) => moveAdditionalImage(id, 1)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {errorMessage ? (
              <p className="text-sm text-rose-600">{errorMessage}</p>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
            >
              Dismiss
            </Button>
            <Button
              type="button"
              variant="highlight"
              onClick={() => {
                if (!isEditMode) {
                  const slugValidationError = validateSlug()
                  if (slugValidationError) {
                    setSlugError(slugValidationError)
                    return
                  }
                }
                setSlugError("")
                onSave?.({
                  imageFile,
                  year,
                  slug: derivedSlug,
                  title: titleValue,
                  caption,
                  additionalImages,
                  existingAdditionalImages,
                  additionalImageOrder,
                  removedAdditionalImageIds,
                })
              }}
              disabled={isSaveDisabled}
            >
              {isSubmitting ? <SavingDotsLabel /> : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminDialog
        open={errorDialogOpen}
        onOpenChange={setErrorDialogOpen}
        title="File Upload Error"
        description={errorDialogMessage}
        confirmLabel="OK"
        variant="error"
        className="w-full max-w-[85vw] sm:max-w-md"
      />
    </>
  )
}

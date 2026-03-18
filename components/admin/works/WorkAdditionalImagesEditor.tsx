"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ExistingAdditionalImage = {
  id: string
  url: string
  caption: string
}

type NewAdditionalImage = {
  file: File
  previewUrl: string
  caption: string
}

type WorkAdditionalImagesEditorProps = {
  existingAdditionalImages: ExistingAdditionalImage[]
  newAdditionalImages: NewAdditionalImage[]
  onRemoveExistingAdditionalImage: (id: string) => void
  onRemoveNewAdditionalImage: (index: number) => void
  onExistingCaptionChange: (id: string, caption: string) => void
  onNewCaptionChange: (index: number, caption: string) => void
}

export default function WorkAdditionalImagesEditor({
  existingAdditionalImages,
  newAdditionalImages,
  onRemoveExistingAdditionalImage,
  onRemoveNewAdditionalImage,
  onExistingCaptionChange,
  onNewCaptionChange,
}: WorkAdditionalImagesEditorProps) {
  if (existingAdditionalImages.length === 0 && newAdditionalImages.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {existingAdditionalImages.map((item, index) => (
        <div
          key={item.id}
          className="rounded-md border border-border p-3 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
              <Image
                src={item.url}
                alt={`Additional image ${index + 1}`}
                width={72}
                height={72}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor={`existing-additional-caption-${item.id}`}>
                추가 이미지 캡션 {index + 1} (optional)
              </Label>
              <Textarea
                id={`existing-additional-caption-${item.id}`}
                value={item.caption}
                onChange={(event) =>
                  onExistingCaptionChange(item.id, event.target.value)
                }
                placeholder="추가 이미지 캡션을 입력해주세요"
                className="min-h-[72px]"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveExistingAdditionalImage(item.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-red-400"
              aria-label={`Remove additional image ${index + 1}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {newAdditionalImages.map((item, index) => (
        <div
          key={`${item.file.name}-${item.file.size}-${item.file.lastModified}`}
          className="rounded-md border border-border p-3 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
              <Image
                src={item.previewUrl}
                alt={`Additional preview ${index + 1}`}
                width={72}
                height={72}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor={`new-additional-caption-${index}`}>
                새 추가 이미지 캡션 {index + 1} (optional)
              </Label>
              <Textarea
                id={`new-additional-caption-${index}`}
                value={item.caption}
                onChange={(event) => onNewCaptionChange(index, event.target.value)}
                placeholder="추가 이미지 캡션을 입력해주세요"
                className="min-h-[72px]"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveNewAdditionalImage(index)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-red-400"
              aria-label={`Remove new additional image ${index + 1}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
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
import SavingDotsLabel from "../shared/SavingDotsLabel"

type HeroUploadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  captionValue?: string
  onCaptionChange?: (value: string) => void
  onUpload: (file: File, caption: string) => void
  onSaveCaption?: (caption: string) => void
  hasExistingHero?: boolean
  confirmLabel?: string
  isSubmitting?: boolean
  errorMessage?: string
}

const maxImageSizeBytes = 1.5 * 1024 * 1024

export default function HeroUploadModal({
  open,
  onOpenChange,
  title = "Upload hero image",
  description = "Upload a new image for the main page hero. This image is used only on the main page and will not appear in works.",
  captionValue = "",
  onCaptionChange,
  onUpload,
  onSaveCaption,
  hasExistingHero = false,
  confirmLabel = "Save",
  isSubmitting = false,
  errorMessage,
}: HeroUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [fileError, setFileError] = useState("")

  const handleFileChange = (file: File | null) => {
    setFileError("")
    if (!file) {
      setImagePreviewUrl("")
      setSelectedFile(null)
      return
    }

    if (file.size > maxImageSizeBytes) {
      setFileError("Image must be under 1.5 MB.")
      setSelectedFile(null)
      return
    }

    if (file.type && !file.type.startsWith("image/")) {
      setFileError("Only image files are allowed.")
      setSelectedFile(null)
      return
    }

    setImagePreviewUrl(URL.createObjectURL(file))
    setSelectedFile(file)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedFile(null)
      setImagePreviewUrl("")
      setFileError("")
    }
    onOpenChange(nextOpen)
  }

  const canSaveCaptionOnly = hasExistingHero && !selectedFile

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const handleConfirm = () => {
    const caption = captionValue?.trim() ?? ""
    if (selectedFile) {
      onUpload(selectedFile, caption)
    } else if (canSaveCaptionOnly && onSaveCaption) {
      onSaveCaption(caption)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero-upload">Image upload</Label>
            <label
              htmlFor="hero-upload"
              className="flex min-h-[120px] w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              <span>
                Drop image or click to upload
                {selectedFile ? (
                  <span className="mt-2 block text-xs text-muted-foreground">
                    Selected: {selectedFile.name}
                  </span>
                ) : null}
              </span>
            </label>
            <Input
              id="hero-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                handleFileChange(file)
              }}
            />
            {imagePreviewUrl ? (
              <div className="overflow-hidden rounded-md border border-border">
                <Image
                  src={imagePreviewUrl}
                  alt="Upload preview"
                  width={400}
                  height={200}
                  className="h-48 w-full object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            {fileError ? (
              <p className="text-sm text-rose-600">{fileError}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-caption">Caption</Label>
            <Input
              id="hero-caption"
              type="text"
              placeholder="Enter caption for hero image"
              onChange={(e) => onCaptionChange?.(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
          {errorMessage ? (
            <p className="text-sm text-rose-600 w-full">{errorMessage}</p>
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
            onClick={handleConfirm}
            disabled={(!selectedFile && !canSaveCaptionOnly) || isSubmitting}
          >
            {isSubmitting ? <SavingDotsLabel /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

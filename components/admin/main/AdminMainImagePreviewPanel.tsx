"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import HeroUploadModal from "@/components/admin/main/HeroUploadModal"
import AdminDialog from "@/components/admin/shared/AdminDialog"

type AdminMainImagePreviewPanelProps = {
  heroImageUrl?: string | null
  heroCaption?: string | null
}

export default function AdminMainImagePreviewPanel({
  heroImageUrl,
  heroCaption,
}: AdminMainImagePreviewPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [modalCaption, setModalCaption] = useState("")
  const [currentImageUrl, setCurrentImageUrl] = useState(heroImageUrl ?? "")
  const [currentCaption, setCurrentCaption] = useState(heroCaption ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  const handleUpload = async (file: File, caption: string) => {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("caption", caption)

      const response = await fetch("/api/admin/hero-image", {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json()) as {
        publicUrl?: string
        error?: string
      }

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to upload hero image.")
        return
      }

      if (payload.publicUrl) {
        setCurrentImageUrl(payload.publicUrl)
      }
      setCurrentCaption(caption)
      setModalCaption("")

      setIsModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to upload hero image", { error })
      setErrorMessage("Unable to upload the hero image. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = async () => {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/admin/hero-image", {
        method: "DELETE",
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to clear hero image.")
        return
      }

      setCurrentImageUrl("")
      setCurrentCaption("")
      setModalCaption("")
      setIsModalOpen(false)
      setIsClearDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to clear hero image", { error })
      setErrorMessage("Unable to clear the hero image. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveCaption = async (caption: string) => {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/admin/hero-image", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to update caption.")
        return
      }

      setCurrentCaption(caption)
      setModalCaption("")

      setIsModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to update hero caption", { error })
      setErrorMessage("Unable to update the caption. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>메인 이미지 업로드 | 수정 | 삭제</CardTitle>
        <div className="flex items-center gap-2">
          <AdminDialog
            open={isClearDialogOpen}
            onOpenChange={setIsClearDialogOpen}
            onConfirm={handleClear}
            isLoading={isSubmitting}
            trigger={
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsClearDialogOpen(true)}
                disabled={isSubmitting || !currentImageUrl}
              >
                Clear hero
              </Button>
            }
            title="Delete hero image?"
            description="삭제 후 복구할 수 없습니다. 진행하시겠습니까?"
            confirmLabel="Delete"
            loadingLabel="Deleting..."
            showCancel={true}
            variant="destructive"
          />
          <Button
            type="button"
            variant="highlight"
            onClick={() => {
              setErrorMessage("")
              setModalCaption("")
              setIsModalOpen(true)
            }}
          >
            <span className="hidden md:inline">Change image</span>
            <span className="md:hidden">Change</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3 max-w-5xl">
        <div className="space-y-3 md:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">
            Desktop (5:3)
          </p>
          <div className="relative aspect-5/3 w-full overflow-hidden rounded-md border border-dashed border-border bg-muted/30">
            {currentImageUrl ? (
              <Image
                src={currentImageUrl}
                alt="Hero image preview for desktop"
                fill
                sizes="(min-width: 768px) 66vw, 100vw"
                className="object-scale-down"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                No hero image yet
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Mobile (9:16)
          </p>
          <div className="relative aspect-9/16 w-full rounded-md border border-dashed border-border bg-muted/30">
            {currentImageUrl ? (
              <Image
                src={currentImageUrl}
                alt="Hero image preview for mobile"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-scale-down"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                No hero image yet
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <p className="text-sm font-medium">Caption text :</p>
          {currentCaption ? (
            <p className="text-sm text-muted-foreground">{currentCaption}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No caption text yet
            </p>
          )}
        </div>
      </CardContent>
      <HeroUploadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Upload hero image"
        description="Upload a new image for the main page hero. This image is used only on the main page and will not appear in works."
        captionValue={modalCaption}
        onCaptionChange={setModalCaption}
        onUpload={handleUpload}
        onSaveCaption={handleSaveCaption}
        hasExistingHero={!!currentImageUrl}
        confirmLabel="Save"
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </Card>
  )
}

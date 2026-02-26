"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import HeroSelectModal, {
  type HeroArtworkOption,
} from "@/components/admin/main/HeroSelectModal"

type AdminMainImagePreviewPanelProps = {
  heroImageUrl?: string | null
  heroArtworkId?: string | null
  artworkOptions: HeroArtworkOption[]
}

export default function AdminMainImagePreviewPanel({
  heroImageUrl,
  heroArtworkId,
  artworkOptions,
}: AdminMainImagePreviewPanelProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(heroImageUrl ?? "")
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const updateHero = async (artworkId: string | null) => {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/admin/hero-artwork", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to update hero image.")
        return
      }

      if (artworkId) {
        const selectedOption = artworkOptions.find((o) => o.id === artworkId)
        if (selectedOption) {
          setCurrentImageUrl(selectedOption.imageUrl)
        }
      } else {
        setCurrentImageUrl("")
      }

      setSelectedArtworkId(null)
      setIsSelectOpen(false)
    } catch (error) {
      console.error("Failed to update hero image", { error })
      setErrorMessage("Unable to update the hero image. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedArtworkId) {
      setErrorMessage("Select an artwork.")
      return
    }
    await updateHero(selectedArtworkId)
  }

  const handleClear = async () => {
    await updateHero(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>메인 이미지 선택 | 수정 | 삭제</CardTitle>
        <Button
          type="button"
          variant="highlight"
          onClick={() => {
            setErrorMessage("")
            setSelectedArtworkId(heroArtworkId ?? null)
            setIsSelectOpen(true)
          }}
        >
          <span className="hidden md:inline">Change image</span>
          <span className="md:hidden">Change</span>
        </Button>
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
      </CardContent>
      <HeroSelectModal
        open={isSelectOpen}
        onOpenChange={setIsSelectOpen}
        title="Select hero image"
        description="Choose an artwork to use as the main hero image."
        options={artworkOptions}
        selectedArtworkId={selectedArtworkId}
        onSelect={setSelectedArtworkId}
        onConfirm={handleConfirm}
        onClear={handleClear}
        confirmLabel="Save"
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </Card>
  )
}

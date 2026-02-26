"use client"

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
import { cn } from "@/lib/utils"

export type HeroArtworkOption = {
  id: string
  slug: string
  title: string
  imageUrl: string
}

type HeroSelectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  options: HeroArtworkOption[]
  selectedArtworkId: string | null
  onSelect: (artworkId: string | null) => void
  onConfirm: () => void
  onClear?: () => void
  confirmLabel?: string
  clearLabel?: string
  isSubmitting?: boolean
  errorMessage?: string
}

export default function HeroSelectModal({
  open,
  onOpenChange,
  title = "Select hero image",
  description = "Choose an artwork to use as the main hero image.",
  options,
  selectedArtworkId,
  onSelect,
  onConfirm,
  onClear,
  confirmLabel = "Save",
  clearLabel = "Clear hero",
  isSubmitting = false,
  errorMessage,
}: HeroSelectModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onSelect(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md md:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No artworks available. Add works first.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    onSelect(selectedArtworkId === option.id ? null : option.id)
                  }
                  className={cn(
                    "relative aspect-square rounded-md border-2 overflow-hidden transition-colors",
                    selectedArtworkId === option.id
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-border hover:border-muted-foreground/50",
                  )}
                >
                  <Image
                    src={option.imageUrl}
                    alt={option.title || option.slug}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-white truncate">
                    {option.title || option.slug}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
          {errorMessage ? (
            <p className="text-sm text-rose-600 w-full">{errorMessage}</p>
          ) : null}
          {onClear ? (
            <Button
              type="button"
              variant="outline"
              onClick={onClear}
              disabled={isSubmitting}
            >
              {clearLabel}
            </Button>
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
            onClick={onConfirm}
            disabled={!selectedArtworkId || isSubmitting}
          >
            {isSubmitting ? "Saving..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

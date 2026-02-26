"use client"

import type { ExhibitionCategory } from "@/components/admin/exhibition/ExhibitionUploadModal"
import type { ExhibitionPreviewItem } from "@/components/admin/exhibition/types"
import ImageCaptionPreview from "@/components/admin/shared/ImageCaptionPreview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ExhibitionCardByCategoryProps = {
  title: string
  category: ExhibitionCategory
  items: ExhibitionPreviewItem[]
  isLoading?: boolean
  onAdd: (category: ExhibitionCategory) => void
  onEdit: (item: ExhibitionPreviewItem) => void
  onDelete: (item: ExhibitionPreviewItem) => Promise<void>
}

export default function ExhibitionCardByCategory({
  title,
  category,
  items,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
}: ExhibitionCardByCategoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button
          type="button"
          variant="highlight"
          onClick={() => onAdd(category)}
        >
          <span className="hidden md:inline">Add</span>
          <span className="md:hidden">Add</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading exhibition...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No exhibition yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 pb-2">
                <div className="flex-1">
                  <ImageCaptionPreview
                    imageUrl={item.imageUrl}
                    title={item.exhibitionTitle}
                    caption={item.caption}
                    onEdit={() => {
                      onEdit(item)
                    }}
                    onDelete={() => onDelete(item)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import ImageCaptionPreview from "@/components/admin/shared/ImageCaptionPreview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WorkPreviewItem } from "@/components/admin/works/hooks/useWorksPanelData"

type WorksCardByYearProps = {
  yearLabel: string
  items: WorkPreviewItem[]
  isLoading?: boolean
  onAdd: () => void
  onEdit: (item: WorkPreviewItem) => void | Promise<void>
  onDelete: (item: WorkPreviewItem) => Promise<void>
}

export default function WorksCardByYear({
  yearLabel,
  items,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
}: WorksCardByYearProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{yearLabel}</CardTitle>
        <Button type="button" variant="highlight" onClick={onAdd}>
          <span className="hidden md:inline">Add</span>
          <span className="md:hidden">Add</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading works...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No works yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 pb-2 last:border-b-0 last:pb-0"
              >
                <div className="flex-1">
                  <ImageCaptionPreview
                    imageUrl={item.imageUrl}
                    title={item.title}
                    caption={item.caption}
                    onEdit={() => onEdit(item)}
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

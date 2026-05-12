"use client"

import { useState } from "react"
import Image from "next/image"
import { GripVertical, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AdditionalImageEditorItem = {
  id: string
  imageUrl: string
  caption: string
  isExisting: boolean
}

type WorkAdditionalImagesEditorProps = {
  items: AdditionalImageEditorItem[]
  onRemove: (id: string) => void
  onCaptionChange: (id: string, caption: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export default function WorkAdditionalImagesEditor({
  items,
  onRemove,
  onCaptionChange,
  onMoveUp,
  onMoveDown,
}: WorkAdditionalImagesEditorProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const fromIndex = items.findIndex((item) => item.id === draggedId)
    const toIndex = items.findIndex((item) => item.id === targetId)

    if (fromIndex < 0 || toIndex < 0) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const moveCount = Math.abs(toIndex - fromIndex)
    const move = fromIndex < toIndex ? onMoveDown : onMoveUp

    for (let i = 0; i < moveCount; i += 1) {
      move(draggedId)
    }

    setDraggedId(null)
    setDragOverId(null)
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`rounded-md border border-border p-3 space-y-3 ${
            dragOverId === item.id ? "bg-muted/40" : ""
          }`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOverId(item.id)
          }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={() => handleDrop(item.id)}
        >
          <div className="flex items-start gap-3">
            <div
              role="button"
              tabIndex={0}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move"
                event.dataTransfer.setData("text/plain", item.id)
                setDraggedId(item.id)
              }}
              onDragEnd={() => {
                setDraggedId(null)
                setDragOverId(null)
              }}
              className="flex h-20 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground active:cursor-grabbing"
              aria-label={`Drag additional image ${index + 1} to reorder`}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
              <Image
                src={item.imageUrl}
                alt={`Additional image ${index + 1}`}
                width={72}
                height={72}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor={`additional-caption-${item.id}`}>
                {item.isExisting ? "상세 이미지" : "상세 이미지"} 캡션{" "}
                {index + 1} (optional)
              </Label>
              <Textarea
                id={`additional-caption-${item.id}`}
                value={item.caption}
                onChange={(event) => onCaptionChange(item.id, event.target.value)}
                placeholder="상세 이미지 캡션을 입력해주세요"
                className="min-h-[48px]"
              />
            </div>
            <div className="flex shrink-0 self-stretch items-end">
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex h-4 w-4 items-center justify-center bg-white text-red-500 hover:text-red-300"
                aria-label={`Remove additional image ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

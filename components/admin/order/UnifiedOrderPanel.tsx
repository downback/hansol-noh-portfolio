"use client"

import { useCallback, useEffect, useState } from "react"
import { GripVertical } from "lucide-react"
import type { UnifiedOrderItemWithMeta } from "@/app/api/admin/unified-order/route"

const formatSlugForDisplay = (slug: string) => slug.replace(/-/g, " ")

export default function UnifiedOrderPanel() {
  const [items, setItems] = useState<UnifiedOrderItemWithMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage("")
    try {
      const response = await fetch("/api/admin/unified-order")
      const payload = (await response.json()) as {
        items?: UnifiedOrderItemWithMeta[]
        error?: string
      }
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load order.")
      }
      setItems(payload.items ?? [])
    } catch (error) {
      console.error("Failed to load unified order", { error })
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load order.",
      )
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return
      const nextItems = [...items]
      const [moved] = nextItems.splice(fromIndex, 1)
      nextItems.splice(toIndex, 0, moved)
      setItems(nextItems)

      const orderedItems = nextItems.map((item) => ({
        entityType: item.entityType,
        entityId: item.entityId,
      }))

      fetch("/api/admin/unified-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedItems }),
      })
        .then(async (res) => {
          const payload = (await res.json()) as { error?: string }
          if (!res.ok) {
            throw new Error(payload.error || "Unable to save order.")
          }
        })
        .catch((err) => {
          console.error("Failed to persist order", { err })
          setErrorMessage(
            err instanceof Error ? err.message : "Unable to save order.",
          )
          void loadItems()
        })
    },
    [items, loadItems],
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Order</h2>
      <p className="text-sm text-muted-foreground">
        Drag and drop to reorder works and exhibitions in the sidebar.
      </p>
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No works or exhibitions yet. Add items from Works or Exhibitions.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div
              key={`${item.entityType}-${item.entityId}`}
              className={`flex items-center gap-3 rounded-md border border-border px-3 py-2 ${
                dragOverIndex === index ? "bg-muted/40" : ""
              }`}
              draggable
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverIndex(index)
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={() => {
                if (draggedIndex !== null) {
                  moveItem(draggedIndex, index)
                }
                setDraggedIndex(null)
                setDragOverIndex(null)
              }}
            >
              <div className="flex items-center text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground uppercase mr-2">
                  {item.entityType}
                </span>
                <span className="text-sm truncate">
                  {item.slug
                    ? formatSlugForDisplay(item.slug)
                    : item.title ?? "Untitled"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length > 0 ? (
        <p className="text-xs text-muted-foreground">Drag rows to reorder</p>
      ) : null}
    </div>
  )
}

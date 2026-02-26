import { NextResponse } from "next/server"
import {
  createServerErrorResponse,
  insertActivityLog,
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import { createUpdateErrorResponse } from "@/lib/server/reorderRoute"
import { supabaseServer } from "@/lib/server"
import { isUuid } from "@/lib/validation"

export type UnifiedOrderItem = {
  entityType: "work" | "exhibition"
  entityId: string
  displayOrder: number
}

export type UnifiedOrderItemWithMeta = UnifiedOrderItem & {
  id: string
  title: string | null
  slug: string | null
}

export async function GET() {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: orderRows, error: orderError } = await supabase
      .from("unified_work_order")
      .select("id, entity_type, entity_id, display_order")
      .order("display_order", { ascending: true })

    if (orderError) {
      console.error("Failed to load unified order", { error: orderError })
      return createServerErrorResponse("Unable to load order.")
    }

    if (!orderRows?.length) {
      return NextResponse.json({ items: [] })
    }

    const workIds = orderRows
      .filter((r) => r.entity_type === "work")
      .map((r) => r.entity_id)
    const exhibitionIds = orderRows
      .filter((r) => r.entity_type === "exhibition")
      .map((r) => r.entity_id)

    const [worksResult, exhibitionsResult] = await Promise.all([
      workIds.length > 0
        ? supabase
            .from("artworks")
            .select("id, title, slug")
            .in("id", workIds)
        : { data: [] },
      exhibitionIds.length > 0
        ? supabase
            .from("exhibitions")
            .select("id, title, slug")
            .in("id", exhibitionIds)
        : { data: [] },
    ])

    const worksById = new Map(
      (worksResult.data ?? []).map((w) => [w.id, w]),
    )
    const exhibitionsById = new Map(
      (exhibitionsResult.data ?? []).map((e) => [e.id, e]),
    )

    const items: UnifiedOrderItemWithMeta[] = orderRows.map((row) => {
      const meta =
        row.entity_type === "work"
          ? worksById.get(row.entity_id)
          : exhibitionsById.get(row.entity_id)
      return {
        id: row.id,
        entityType: row.entity_type as "work" | "exhibition",
        entityId: row.entity_id,
        displayOrder: row.display_order,
        title: meta?.title ?? null,
        slug: meta?.slug ?? null,
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Unified order GET failed", { error })
    return createServerErrorResponse("Server error while loading order.")
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: body, errorResponse: parseErrorResponse } =
      await parseJsonBody<{
        orderedItems?: Array<{ entityType: string; entityId: string }>
      }>(request)
    if (!body || parseErrorResponse) {
      return parseErrorResponse
    }

    const orderedItems = body.orderedItems ?? []
    if (orderedItems.length === 0) {
      return NextResponse.json(
        { error: "Missing ordered items." },
        { status: 400 },
      )
    }

    const entityTypes = new Set(orderedItems.map((i) => i.entityType))
    const invalidType = [...entityTypes].find(
      (t) => t !== "work" && t !== "exhibition",
    )
    if (invalidType) {
      return NextResponse.json(
        { error: "Invalid entity type." },
        { status: 400 },
      )
    }

    if (orderedItems.some((i) => !isUuid(i.entityId))) {
      return NextResponse.json(
        { error: "Invalid entity id." },
        { status: 400 },
      )
    }

    const updates = orderedItems.map((item, index) =>
      supabase
        .from("unified_work_order")
        .update({ display_order: index })
        .eq("entity_type", item.entityType)
        .eq("entity_id", item.entityId),
    )

    const results = await Promise.all(updates)
    const updateErrorResponse = createUpdateErrorResponse(
      results,
      "Unable to reorder.",
    )
    if (updateErrorResponse) {
      return updateErrorResponse
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "unified_order",
      entityId: orderedItems[0]?.entityId ?? "",
      metadata: {},
      logContext: "Unified order update",
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Unified order PATCH failed", { error })
    return createServerErrorResponse("Server error while reordering.")
  }
}

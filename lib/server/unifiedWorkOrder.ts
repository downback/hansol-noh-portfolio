import type { ServerSupabaseClient } from "@/lib/server/adminRoute"

export async function getNextDisplayOrder(supabase: ServerSupabaseClient) {
  const { data, error } = await supabase
    .from("unified_work_order")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data?.display_order ?? -1) + 1
}

export async function insertUnifiedWorkOrder(
  supabase: ServerSupabaseClient,
  entityType: "work" | "exhibition",
  entityId: string,
  displayOrder: number,
) {
  const { error } = await supabase.from("unified_work_order").insert({
    entity_type: entityType,
    entity_id: entityId,
    display_order: displayOrder,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteUnifiedWorkOrder(
  supabase: ServerSupabaseClient,
  entityType: "work" | "exhibition",
  entityId: string,
) {
  const { error } = await supabase
    .from("unified_work_order")
    .delete()
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)

  if (error) {
    throw new Error(error.message)
  }
}

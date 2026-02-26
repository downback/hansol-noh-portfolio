import { NextResponse } from "next/server"
import {
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import { supabaseServer } from "@/lib/server"
import { isUuid } from "@/lib/validation"

type PatchBody = {
  artworkId?: string | null
}

export async function PATCH(request: Request) {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: body, errorResponse: parseError } =
      await parseJsonBody<PatchBody>(request)
    if (parseError) {
      return parseError
    }

    const artworkId = body?.artworkId ?? null

    if (artworkId !== null && !isUuid(artworkId)) {
      return NextResponse.json(
        { error: "Invalid artwork id." },
        { status: 400 },
      )
    }

    // Clear hero from all artworks
    const { error: clearError } = await supabase
      .from("artworks")
      .update({ is_hero: false })
      .eq("category", "works")

    if (clearError) {
      console.error("Failed to clear hero artworks", { error: clearError })
      return NextResponse.json(
        { error: "Unable to update hero artwork." },
        { status: 500 },
      )
    }

    if (artworkId) {
      const { error: setError } = await supabase
        .from("artworks")
        .update({ is_hero: true })
        .eq("id", artworkId)
        .eq("category", "works")

      if (setError) {
        console.error("Failed to set hero artwork", { error: setError })
        return NextResponse.json(
          { error: "Unable to set hero artwork." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Hero artwork update failed", { error })
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    )
  }
}

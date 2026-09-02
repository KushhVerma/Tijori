import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { resolveActor } from "@/lib/auth/resolve-actor"
import * as itemsService from "@/lib/items/service"

const updateItemSchema = z.object({
  title: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  favorite: z.boolean().optional(),
  organized: z.boolean().optional(),
  tagNames: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest, ctx: RouteContext<"/api/v1/items/[id]">) {
  const actor = await resolveActor(request)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const item = await itemsService.getItem(actor.supabase, actor.userId, id)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ item })
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/v1/items/[id]">) {
  const actor = await resolveActor(request)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = updateItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
  }

  const { id } = await ctx.params
  const item = await itemsService.updateItem(actor.supabase, actor.userId, id, parsed.data)

  return NextResponse.json({ item })
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/v1/items/[id]">) {
  const actor = await resolveActor(request)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  await itemsService.deleteItem(actor.supabase, actor.userId, id)

  return new NextResponse(null, { status: 204 })
}

import { NextResponse, type NextRequest } from "next/server"

import { resolveActor } from "@/lib/auth/resolve-actor"
import * as foldersService from "@/lib/folders/service"

// Read-only: the extension polls this to build its "Save to Tijori" submenu
// (see Tijori/extension/background.js). Creating a folder is a web-app-only
// action for now, same as tags.
export async function GET(request: NextRequest) {
  const actor = await resolveActor(request)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const folders = await foldersService.listFolders(actor.supabase, actor.userId)
  return NextResponse.json({ folders })
}

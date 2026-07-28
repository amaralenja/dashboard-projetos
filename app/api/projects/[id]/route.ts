import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase, getSupabase } from "@/lib/supabase";
import { HistoryEntry, Project } from "@/lib/types";

function mapProjectRow(p: Record<string, unknown>): Project {
  return {
    id: p.id as string,
    name: p.name as string,
    description: (p.description as string) || "",
    tagId: (p.tag_id as string) || null,
    commission: (p.commission as number) ?? null,
    imagePath: (p.image_path as string) || null,
    githubUrl: (p.github_url as string) || null,
    dbName: (p.db_name as string) || null,
    dbAccess: (p.db_access as string) || null,
    ownerPhone: (p.owner_phone as string) || null,
    documentCount: 0,
    githubUser: (p.github_user as string) || null,
    vercelAccount: (p.vercel_account as string) || null,
    projectUrl: (p.project_url as string) || null,
    createdAt: p.created_at as string,
    history: Array.isArray(p.history)
      ? (p.history as Record<string, unknown>[]).map((h) => ({
          id: h.id as string,
          date: h.date as string,
          type: h.type as HistoryEntry["type"],
          description: h.description as string,
          replyTo: (h.reply_to as string) || null,
          reactions: (h.reactions as string[]) || [],
        }))
      : [],
  };
}

function getTagName(tags: { id: string; name: string }[], tagId: string | null): string {
  if (!tagId) return "Sem status";
  const tag = tags.find((t) => t.id === tagId);
  return tag ? tag.name : "Desconhecido";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getAuthSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*, history:project_history(*)")
    .eq("id", id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(mapProjectRow(project as Record<string, unknown>));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = await getAuthSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from("projects")
      .select("tag_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Projeto nao encontrado" }, { status: 404 });
    }

    const oldTagId = existing.tag_id as string | null;
    const newTagId = body.tagId !== undefined ? body.tagId : oldTagId;

    if (body.note && typeof body.note === "string" && body.note.trim()) {
      await supabase.from("project_history").insert({
        id: `h-${Date.now()}`,
        project_id: id,
        date: new Date().toISOString(),
        type: "note",
        description: body.note.trim(),
        reply_to: body.replyTo || null,
        reactions: [],
      });
    }

    if (body.editEntryId && typeof body.editText === "string") {
      await supabase
        .from("project_history")
        .update({ description: body.editText.trim(), date: new Date().toISOString() })
        .eq("id", body.editEntryId)
        .eq("project_id", id);
    }

    if (body.deleteEntryId) {
      await supabase
        .from("project_history")
        .delete()
        .eq("id", body.deleteEntryId)
        .eq("project_id", id);
    }

    if (body.reactEntryId && body.emoji) {
      const { data: entryData } = await supabase
        .from("project_history")
        .select("reactions")
        .eq("id", body.reactEntryId)
        .single();

      if (entryData) {
        const reactions: string[] = Array.isArray(entryData.reactions) ? entryData.reactions : [];
        const idx = reactions.indexOf(body.emoji);
        if (idx === -1) reactions.push(body.emoji);
        else reactions.splice(idx, 1);
        await supabase
          .from("project_history")
          .update({ reactions })
          .eq("id", body.reactEntryId);
      }
    }

    if (body.tagId !== undefined && body.tagId !== oldTagId) {
      const { data: tags } = await supabase.from("tags").select("id, name");
      const allTags = (tags || []) as { id: string; name: string }[];
      const oldName = getTagName(allTags, oldTagId);
      const newName = getTagName(allTags, newTagId);
      await supabase.from("project_history").insert({
        id: `h-${Date.now() + 1}`,
        project_id: id,
        date: new Date().toISOString(),
        type: "status_change",
        description: `Status alterado de "${oldName}" para "${newName}"`,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name || "";
    if (body.description !== undefined) updateData.description = body.description || "";
    updateData.tag_id = newTagId;
    if (body.commission !== undefined) updateData.commission = body.commission;
    if (body.githubUser !== undefined) updateData.github_user = body.githubUser || null;
    if (body.vercelAccount !== undefined) updateData.vercel_account = body.vercelAccount || null;
    if (body.projectUrl !== undefined) updateData.project_url = body.projectUrl || null;
    if (body.githubUrl !== undefined) updateData.github_url = body.githubUrl || null;
    if (body.dbName !== undefined) updateData.db_name = body.dbName || null;
    if (body.dbAccess !== undefined) updateData.db_access = body.dbAccess || null;
    if (body.ownerPhone !== undefined) updateData.owner_phone = body.ownerPhone || null;
    if (body.imagePath !== undefined) updateData.image_path = body.imagePath || null;

    const adminClient = getSupabase();
    const { error: updateError } = await adminClient
      .from("projects")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: updated, error: refetchError } = await supabase
      .from("projects")
      .select("*, history:project_history(*)")
      .eq("id", id)
      .single();

    if (refetchError || !updated) {
      return NextResponse.json(mapProjectRow({ id, name: body.name, description: body.description, tag_id: newTagId, commission: undefined, github_user: undefined, vercel_account: undefined, project_url: undefined, image_path: undefined, created_at: "", history: [] } as Record<string, unknown>));
    }

    return NextResponse.json(mapProjectRow(updated as Record<string, unknown>));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getAuthSupabase();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

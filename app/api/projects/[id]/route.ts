import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/supabase";
import { readData } from "@/lib/data";
import { HistoryEntry, Project } from "@/lib/types";

function mapProjectRow(p: Record<string, unknown>): Project {
  return {
    id: p.id as string,
    name: p.name as string,
    description: (p.description as string) || "",
    tagId: (p.tag_id as string) || null,
    commission: (p.commission as number) ?? null,
    imagePath: (p.image_path as string) || null,
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
  const { id } = await params;
  const body = await req.json();
  const supabase = await getAuthSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("tag_id, history:project_history(*)")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const oldTagId = existing.tag_id as string | null;
  const newTagId = body.tagId !== undefined ? body.tagId : oldTagId;

  const newHistory: HistoryEntry[] = [];

  if (body.note && typeof body.note === "string" && body.note.trim()) {
    const historyId = `h-${Date.now()}`;
    await supabase.from("project_history").insert({
      id: historyId,
      project_id: id,
      date: new Date().toISOString(),
      type: "note",
      description: body.note.trim(),
      reply_to: body.replyTo || null,
      reactions: [],
    });
    newHistory.push({
      id: historyId,
      date: new Date().toISOString(),
      type: "note",
      description: body.note.trim(),
      replyTo: body.replyTo || null,
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
      const reactions: string[] = entryData.reactions || [];
      const idx = reactions.indexOf(body.emoji);
      if (idx === -1) {
        reactions.push(body.emoji);
      } else {
        reactions.splice(idx, 1);
      }
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
    const historyId = `h-${Date.now() + 1}`;
    await supabase.from("project_history").insert({
      id: historyId,
      project_id: id,
      date: new Date().toISOString(),
      type: "status_change",
      description: `Status alterado de "${oldName}" para "${newName}"`,
    });
    newHistory.push({
      id: historyId,
      date: new Date().toISOString(),
      type: "status_change",
      description: `Status alterado de "${oldName}" para "${newName}"`,
    });
  }

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  updateData.tag_id = newTagId;
  updateData.commission = body.commission !== undefined ? body.commission : undefined;
  updateData.github_user = body.githubUser !== undefined ? (body.githubUser || null) : undefined;
  updateData.vercel_account = body.vercelAccount !== undefined ? (body.vercelAccount || null) : undefined;
  updateData.project_url = body.projectUrl !== undefined ? (body.projectUrl || null) : undefined;
  updateData.image_path = body.imagePath !== undefined ? (body.imagePath || null) : undefined;

  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .select("*, history:project_history(*)")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Update failed" }, { status: 500 });
  }

  return NextResponse.json(mapProjectRow(updated as Record<string, unknown>));
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

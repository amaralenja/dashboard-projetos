import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { readData } from "@/lib/data";
import { HistoryEntry } from "@/lib/types";

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
  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*, history:project_history(*)")
    .eq("id", id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: project.id,
    name: project.name,
    description: project.description || "",
    tagId: project.tag_id || null,
    commission: project.commission ?? null,
    createdAt: project.created_at,
    history: (project.history || []).map((h: Record<string, unknown>) => ({
      id: h.id,
      date: h.date,
      type: h.type,
      description: h.description,
      replyTo: h.reply_to || null,
      reactions: h.reactions || [],
    })),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const supabase = getSupabase();

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

  await supabase
    .from("projects")
    .update({
      name: body.name,
      description: body.description,
      tag_id: newTagId,
      commission: body.commission !== undefined ? body.commission : undefined,
    })
    .eq("id", id);

  const { data: updated } = await supabase
    .from("projects")
    .select("*, history:project_history(*)")
    .eq("id", id)
    .single();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    description: updated.description || "",
    tagId: updated.tag_id || null,
    commission: updated.commission ?? null,
    createdAt: updated.created_at,
    history: (updated.history || []).map((h: Record<string, unknown>) => ({
      id: h.id,
      date: h.date,
      type: h.type,
      description: h.description,
      replyTo: h.reply_to || null,
      reactions: h.reactions || [],
    })),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

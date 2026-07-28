import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";
import { HistoryEntry } from "@/lib/types";

function getTagName(data: ReturnType<typeof readData>, tagId: string | null): string {
  if (!tagId) return "Sem status";
  const tag = data.tags.find((t) => t.id === tagId);
  return tag ? tag.name : "Desconhecido";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = readData();
  const project = data.projects.find((p) => p.id === id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = readData();
  const index = data.projects.findIndex((p) => p.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldTagId = data.projects[index].tagId;
  const newTagId = body.tagId !== undefined ? body.tagId : oldTagId;

  const newHistory: HistoryEntry[] = [];

  if (body.note && typeof body.note === "string" && body.note.trim()) {
    newHistory.push({
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      type: "note",
      description: body.note.trim(),
      replyTo: body.replyTo || null,
      reactions: [],
    });
  }

  if (body.editEntryId && typeof body.editText === "string") {
    const hIdx = data.projects[index].history.findIndex((h) => h.id === body.editEntryId);
    if (hIdx !== -1 && data.projects[index].history[hIdx].type === "note") {
      data.projects[index].history[hIdx].description = body.editText.trim();
      data.projects[index].history[hIdx].date = new Date().toISOString();
    }
  }

  if (body.deleteEntryId) {
    data.projects[index].history = data.projects[index].history.filter(
      (h) => h.id !== body.deleteEntryId
    );
  }

  if (body.reactEntryId && body.emoji) {
    const hIdx = data.projects[index].history.findIndex((h) => h.id === body.reactEntryId);
    if (hIdx !== -1) {
      const entry = data.projects[index].history[hIdx];
      if (!entry.reactions) entry.reactions = [];
      const idx = entry.reactions.indexOf(body.emoji);
      if (idx === -1) {
        entry.reactions.push(body.emoji);
      } else {
        entry.reactions.splice(idx, 1);
      }
    }
  }

  if (body.tagId !== undefined && body.tagId !== oldTagId) {
    const oldName = getTagName(data, oldTagId);
    const newName = getTagName(data, newTagId);
    newHistory.push({
      id: `h-${Date.now() + 1}`,
      date: new Date().toISOString(),
      type: "status_change",
      description: `Status alterado de "${oldName}" para "${newName}"`,
    });
  }

  data.projects[index] = {
    ...data.projects[index],
    name: body.name ?? data.projects[index].name,
    description: body.description ?? data.projects[index].description,
    tagId: newTagId,
    commission: body.commission !== undefined ? body.commission : data.projects[index].commission,
    history: [...data.projects[index].history, ...newHistory],
  };

  writeData(data);
  return NextResponse.json(data.projects[index]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = readData();
  const index = data.projects.findIndex((p) => p.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  data.projects.splice(index, 1);
  writeData(data);
  return NextResponse.json({ success: true });
}

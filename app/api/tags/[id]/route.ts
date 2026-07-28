import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data = readData();
  const index = data.tags.findIndex((t) => t.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  data.tags[index] = {
    ...data.tags[index],
    name: body.name ?? data.tags[index].name,
    color: body.color ?? data.tags[index].color,
    isCompleting: body.isCompleting ?? data.tags[index].isCompleting,
  };

  writeData(data);
  return NextResponse.json(data.tags[index]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = readData();
  const index = data.tags.findIndex((t) => t.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  data.tags.splice(index, 1);
  data.projects.forEach((p) => {
    if (p.tagId === id) p.tagId = null;
  });
  writeData(data);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";
import { Tag } from "@/lib/types";

export async function GET() {
  const data = readData();
  return NextResponse.json(data.tags);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const tag: Tag = {
    id: `tag-${Date.now()}`,
    name: body.name || "Nova tag",
    color: body.color || "#6b7280",
    isCompleting: body.isCompleting ?? false,
  };

  data.tags.push(tag);
  writeData(data);

  return NextResponse.json(tag, { status: 201 });
}

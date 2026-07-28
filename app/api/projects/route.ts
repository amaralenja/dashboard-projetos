import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";
import { Project } from "@/lib/types";

export async function GET() {
  const data = readData();
  return NextResponse.json(data.projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const now = new Date().toISOString();
  const project: Project = {
    id: `proj-${Date.now()}`,
    name: body.name || "",
    description: body.description || "",
    tagId: body.tagId || null,
    commission: null,
    createdAt: now,
    history: [
      { id: `h-${Date.now()}`, date: now, type: "create", description: "Projeto criado" },
    ],
  };

  data.projects.push(project);
  writeData(data);

  return NextResponse.json(project, { status: 201 });
}

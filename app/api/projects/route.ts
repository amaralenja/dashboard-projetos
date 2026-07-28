import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { readData, seedDefaultTags } from "@/lib/data";
import { Project } from "@/lib/types";

export async function GET() {
  await seedDefaultTags();
  const data = await readData();
  return NextResponse.json(data.projects);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const body = await req.json();

  const now = new Date().toISOString();
  const projectId = `proj-${Date.now()}`;

  const { error: projectError } = await supabase.from("projects").insert({
    id: projectId,
    name: body.name || "",
    description: body.description || "",
    tag_id: body.tagId || null,
    commission: null,
    created_at: now,
  });

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  await supabase.from("project_history").insert({
    id: `h-${Date.now()}`,
    project_id: projectId,
    date: now,
    type: "create",
    description: "Projeto criado",
  });

  const project: Project = {
    id: projectId,
    name: body.name || "",
    description: body.description || "",
    tagId: body.tagId || null,
    commission: null,
    createdAt: now,
    history: [
      { id: `h-${Date.now()}`, date: now, type: "create", description: "Projeto criado" },
    ],
  };

  return NextResponse.json(project, { status: 201 });
}

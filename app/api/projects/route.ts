import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/supabase";
import { readData, seedDefaultTags } from "@/lib/data";
import { Project } from "@/lib/types";

export async function GET() {
  const supabase = await getAuthSupabase();
  await seedDefaultTags(supabase);
  const data = await readData(supabase);
  return NextResponse.json(data.projects);
}

export async function POST(req: NextRequest) {
  const supabase = await getAuthSupabase();
  const body = await req.json();

  const now = new Date().toISOString();
  const projectId = `proj-${Date.now()}`;

  const insertData: Record<string, unknown> = {
    id: projectId,
    name: body.name || "",
    description: body.description || "",
    tag_id: body.tagId || null,
    commission: null,
    created_at: now,
  };
  if (body.githubUser) insertData.github_user = body.githubUser;
  if (body.vercelAccount) insertData.vercel_account = body.vercelAccount;
  if (body.projectUrl) insertData.project_url = body.projectUrl;

  const { error: projectError } = await supabase.from("projects").insert(insertData);

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
    githubUser: body.githubUser || null,
    vercelAccount: body.vercelAccount || null,
    projectUrl: body.projectUrl || null,
    createdAt: now,
    history: [
      { id: `h-${Date.now()}`, date: now, type: "create", description: "Projeto criado" },
    ],
  };

  return NextResponse.json(project, { status: 201 });
}

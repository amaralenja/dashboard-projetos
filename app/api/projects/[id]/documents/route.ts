import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/supabase";
import { ProjectDocument } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getAuthSupabase();

  const { data, error } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const docs: ProjectDocument[] = (data || []).map((d) => ({
    id: d.id,
    projectId: d.project_id,
    fileName: d.file_name,
    filePath: d.file_path,
    fileSize: d.file_size,
    createdAt: d.created_at,
  }));

  return NextResponse.json(docs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getAuthSupabase();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const fileExt = file.name.split(".").pop() || "";
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = `${id}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("project-docs")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const docId = `doc-${Date.now()}`;
  const { error: insertError } = await supabase.from("project_documents").insert({
    id: docId,
    project_id: id,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const doc: ProjectDocument = {
    id: docId,
    projectId: id,
    fileName: file.name,
    filePath: filePath,
    fileSize: file.size,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(doc, { status: 201 });
}

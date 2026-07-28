import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase, getSupabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  const authSupabase = await getAuthSupabase();
  const storageSupabase = getSupabase();

  const { data: doc, error } = await authSupabase
    .from("project_documents")
    .select("file_path")
    .eq("id", docId)
    .eq("project_id", id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data } = await storageSupabase.storage
    .from("project-docs")
    .createSignedUrl(doc.file_path, 3600);

  if (!data?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download URL" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}

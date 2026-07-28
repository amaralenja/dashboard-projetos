import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  const supabase = await getAuthSupabase();

  const { data: doc, error: fetchError } = await supabase
    .from("project_documents")
    .select("file_path")
    .eq("id", docId)
    .eq("project_id", id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase.storage.from("project-docs").remove([doc.file_path]);

  const { error } = await supabase
    .from("project_documents")
    .delete()
    .eq("id", docId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

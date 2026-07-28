import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/supabase";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const supabase = await getAuthSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from("tags")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.color !== undefined) updates.color = body.color;
  if (body.isCompleting !== undefined) updates.is_completing = body.isCompleting;

  const { data: updated, error } = await supabase
    .from("tags")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    color: updated.color,
    isCompleting: updated.is_completing ?? false,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getAuthSupabase();

  await supabase.from("projects").update({ tag_id: null }).eq("tag_id", id);

  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

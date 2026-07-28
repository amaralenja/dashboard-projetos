import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = await getAuthSupabase();
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const fileName = `cover-${Date.now()}.${ext}`;
  const filePath = `covers/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("project-docs")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("project-docs").getPublicUrl(filePath);

  return NextResponse.json({ path: filePath, url: data.publicUrl });
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/supabase";
import { readData, seedDefaultTags } from "@/lib/data";
import { Tag } from "@/lib/types";

export async function GET() {
  const supabase = await getAuthSupabase();
  await seedDefaultTags(supabase);
  const data = await readData(supabase);
  return NextResponse.json(data.tags);
}

export async function POST(req: NextRequest) {
  const supabase = await getAuthSupabase();
  const body = await req.json();

  const tag: Tag = {
    id: `tag-${Date.now()}`,
    name: body.name || "Nova tag",
    color: body.color || "#6b7280",
    isCompleting: body.isCompleting ?? false,
  };

  const { error } = await supabase.from("tags").insert({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    is_completing: tag.isCompleting,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(tag, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/supabase";

export async function PUT(req: NextRequest) {
  const supabase = await getAuthSupabase();
  const body = await req.json();
  const { projectId, commission } = body;

  const value = typeof commission === "number" ? commission : null;

  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("commission")
    .eq("id", projectId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const oldCommission = existing.commission as number | null;

  if (value !== null && value !== oldCommission) {
    await supabase.from("project_history").insert({
      id: `h-${Date.now()}`,
      project_id: projectId,
      date: new Date().toISOString(),
      type: "commission",
      description: `Comissão de R$ ${value.toFixed(2)} registrada`,
    });
  }

  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update({ commission: value })
    .eq("id", projectId)
    .select("*, history:project_history(*)")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Update failed" }, { status: 500 });
  }

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    description: updated.description || "",
    tagId: updated.tag_id || null,
    commission: updated.commission ?? null,
    githubUser: (updated as Record<string, unknown>).github_user as string || null,
    vercelAccount: (updated as Record<string, unknown>).vercel_account as string || null,
    projectUrl: (updated as Record<string, unknown>).project_url as string || null,
    imagePath: (updated as Record<string, unknown>).image_path as string || null,
    documentCount: 0,
    createdAt: updated.created_at,
    history: (updated.history || []).map((h: Record<string, unknown>) => ({
      id: h.id,
      date: h.date,
      type: h.type,
      description: h.description,
      replyTo: h.reply_to || null,
      reactions: h.reactions || [],
    })),
  });
}

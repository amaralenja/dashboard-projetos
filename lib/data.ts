import { SupabaseClient } from "@supabase/supabase-js";
import { AppData, HistoryEntry, Project, Tag, Withdrawal } from "./types";

function mapTag(db: Record<string, unknown>): Tag {
  return {
    id: db.id as string,
    name: db.name as string,
    color: db.color as string,
    isCompleting: (db.is_completing as boolean) ?? false,
  };
}

function mapHistory(db: Record<string, unknown>): HistoryEntry {
  return {
    id: db.id as string,
    date: db.date as string,
    type: db.type as HistoryEntry["type"],
    description: db.description as string,
    replyTo: (db.reply_to as string) || null,
    reactions: (db.reactions as string[]) || [],
  };
}

function mapProject(db: Record<string, unknown>): Project {
  return {
    id: db.id as string,
    name: db.name as string,
    description: (db.description as string) || "",
    tagId: (db.tag_id as string) || null,
    commission: (db.commission as number) ?? null,
    imagePath: (db.image_path as string) || null,
    githubUser: (db.github_user as string) || null,
    vercelAccount: (db.vercel_account as string) || null,
    projectUrl: (db.project_url as string) || null,
    createdAt: db.created_at as string,
    documentCount: 0,
    history: Array.isArray(db.history)
      ? (db.history as Record<string, unknown>[]).map(mapHistory)
      : [],
  };
}

function mapWithdrawal(db: Record<string, unknown>): Withdrawal {
  return {
    id: db.id as string,
    date: db.date as string,
    amount: db.amount as number,
    createdAt: db.created_at as string,
  };
}

export async function readData(supabase: SupabaseClient): Promise<AppData> {
  const [projectsRes, tagsRes, withdrawalsRes, docsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("*, history:project_history(*)")
      .order("created_at", { ascending: false })
      .order("date", { foreignTable: "project_history", ascending: true }),
    supabase.from("tags").select("*").order("created_at"),
    supabase.from("withdrawals").select("*"),
    supabase.from("project_documents").select("project_id"),
  ]);

  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (tagsRes.error) throw new Error(tagsRes.error.message);
  if (withdrawalsRes.error) throw new Error(withdrawalsRes.error.message);

  const docCounts: Record<string, number> = {};
  for (const d of docsRes.data || []) {
    const pid = d.project_id as string;
    docCounts[pid] = (docCounts[pid] || 0) + 1;
  }

  const tags = (tagsRes.data || []).map(mapTag);
  const projects = (projectsRes.data || []).map((p) => ({
    ...mapProject(p as Record<string, unknown>),
    documentCount: docCounts[p.id as string] || 0,
  }));
  const withdrawals = (withdrawalsRes.data || []).map(mapWithdrawal);

  return { projects, tags, withdrawals };
}

export async function seedDefaultTags(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.from("tags").select("id").limit(1);
  if (data && data.length > 0) return;

  const defaults = [
    { id: "tag-1", name: "Não iniciado", color: "#6b7280", is_completing: false },
    { id: "tag-2", name: "Em andamento", color: "#3b82f6", is_completing: false },
    { id: "tag-3", name: "Em revisão", color: "#f59e0b", is_completing: false },
    { id: "tag-4", name: "Concluído", color: "#22c55e", is_completing: true },
    { id: "tag-5", name: "Cancelado", color: "#ef4444", is_completing: false },
  ];

  await supabase.from("tags").upsert(defaults, { onConflict: "id" });
}

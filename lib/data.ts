import { getSupabase } from "./supabase";
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
    createdAt: db.created_at as string,
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

export async function readData(): Promise<AppData> {
  const supabase = getSupabase();
  const [projectsRes, tagsRes, withdrawalsRes] = await Promise.all([
    supabase.from("projects").select("*, history:project_history(*)").order("created_at", { foreignTable: "project_history", ascending: true }),
    supabase.from("tags").select("*").order("created_at"),
    supabase.from("withdrawals").select("*"),
  ]);

  const tags = (tagsRes.data || []).map(mapTag);
  const projects = (projectsRes.data || []).map(mapProject);
  const withdrawals = (withdrawalsRes.data || []).map(mapWithdrawal);

  return { projects, tags, withdrawals };
}

export async function seedDefaultTags(): Promise<void> {
  const supabase = getSupabase();
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

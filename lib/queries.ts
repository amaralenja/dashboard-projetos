import { Project, Tag, Withdrawal } from "./types";

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  return res.json();
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/tags");
  return res.json();
}

export async function fetchWithdrawals(): Promise<Withdrawal[]> {
  const res = await fetch("/api/withdrawals");
  return res.json();
}

export const queryKeys = {
  projects: ["projects"] as const,
  tags: ["tags"] as const,
  withdrawals: ["withdrawals"] as const,
};

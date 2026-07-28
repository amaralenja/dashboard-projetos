export interface Tag {
  id: string;
  name: string;
  color: string;
  isCompleting: boolean;
}

export interface HistoryEntry {
  id: string;
  date: string;
  type: "create" | "status_change" | "commission" | "withdrawal" | "note";
  description: string;
  replyTo?: string | null;
  reactions?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tagId: string | null;
  commission: number | null;
  createdAt: string;
  history: HistoryEntry[];
}

export interface Withdrawal {
  id: string;
  date: string;
  amount: number;
  createdAt: string;
}

export interface AppData {
  projects: Project[];
  tags: Tag[];
  withdrawals: Withdrawal[];
}

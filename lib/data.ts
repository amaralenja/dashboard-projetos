import fs from "fs";
import path from "path";
import { AppData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const defaultData: AppData = {
  projects: [],
  tags: [
    { id: "tag-1", name: "Não iniciado", color: "#6b7280", isCompleting: false },
    { id: "tag-2", name: "Em andamento", color: "#3b82f6", isCompleting: false },
    { id: "tag-3", name: "Em revisão", color: "#f59e0b", isCompleting: false },
    { id: "tag-4", name: "Concluído", color: "#22c55e", isCompleting: true },
    { id: "tag-5", name: "Cancelado", color: "#ef4444", isCompleting: false },
  ],
  withdrawals: [],
};

export function readData(): AppData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
      return JSON.parse(JSON.stringify(defaultData));
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw) as AppData;
    for (const p of data.projects) {
      if (!Array.isArray(p.history)) p.history = [];
    }
    return data;
  } catch {
    return JSON.parse(JSON.stringify(defaultData));
  }
}

export function writeData(data: AppData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

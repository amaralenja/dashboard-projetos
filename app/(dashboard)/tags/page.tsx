"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Tag } from "@/lib/types";
import { fetchTags, queryKeys } from "@/lib/queries";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7",
  "#d946ef", "#ec4899", "#6b7280", "#1e293b",
];

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-pulse flex items-center gap-3">
      <div className="w-4 h-4 rounded-full bg-slate-200 shrink-0" />
      <div className="h-4 bg-slate-200 rounded w-28" />
    </div>
  );
}

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isCompleting, setIsCompleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: queryKeys.tags,
    queryFn: fetchTags,
  });

  function openNew() {
    setEditing(null);
    setName("");
    setColor("#3b82f6");
    setIsCompleting(false);
    setShowForm(true);
  }

  function openEdit(t: Tag) {
    setEditing(t);
    setName(t.name);
    setColor(t.color);
    setIsCompleting(t.isCompleting);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    if (editing) {
      await fetch(`/api/tags/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, isCompleting }),
      });
    } else {
      await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, isCompleting }),
      });
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.tags });
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta tag? Projetos com ela perdera~o o status.")) return;
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: queryKeys.tags });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tags / Status</h2>
        <button
          onClick={openNew}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          + Nova Tag
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {editing ? "Editar Tag" : "Nova Tag"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                  placeholder='Ex: "Em andamento", "Concluido"'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-colors ${
                        color === c ? "border-slate-900 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs text-slate-500">{color}</span>
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCompleting}
                  onChange={(e) => setIsCompleting(e.target.checked)}
                  className="w-4 h-4 rounded accent-slate-900"
                />
                <span>
                  Marcar como tag finalizadora
                  <span className="block text-xs text-slate-400">
                    Projetos com esta tag podera~o receber comissa~o
                  </span>
                </span>
              </label>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {editing ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-400">Nenhuma tag cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <div>
                  <span className="font-medium text-sm">{t.name}</span>
                  {t.isCompleting && (
                    <span className="ml-2 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                      Finalizadora
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(t)}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

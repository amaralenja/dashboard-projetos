"use client";

import { useEffect, useState } from "react";
import { Project, Tag } from "@/lib/types";
import ProjectModal from "@/components/ProjectModal";

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalProjectId, setModalProjectId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagId, setTagId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [pRes, tRes] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/tags"),
    ]);
    setProjects(await pRes.json());
    setTags(await tRes.json());
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setName("");
    setDescription("");
    setTagId(null);
    setShowForm(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setName(p.name);
    setDescription(p.description);
    setTagId(p.tagId);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (editing) {
      await fetch(`/api/projects/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, tagId }),
      });
    } else {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, tagId }),
      });
    }

    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este projeto?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    loadData();
  }

  function getTag(id: string | null) {
    return tags.find((t) => t.id === id);
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Projetos</h2>
        <button
          onClick={openNew}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          + Novo Projeto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {editing ? "Editar Projeto" : "Novo Projeto"}
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={tagId || ""}
                  onChange={(e) => setTagId(e.target.value || null)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem status</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
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
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  {editing ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-400">Nenhum projeto cadastrado.</p>
          <button
            onClick={openNew}
            className="mt-3 text-blue-600 text-sm hover:underline"
          >
            Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const tag = getTag(p.tagId);
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setModalProjectId(p.id)}
                    className="font-semibold text-sm truncate text-blue-600 hover:underline text-left w-full"
                  >
                    {p.name}
                  </button>
                  {p.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-1.5">
                    {tag ? (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sem status</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalProjectId && (
        <ProjectModal
          projectId={modalProjectId}
          tags={tags}
          onClose={() => setModalProjectId(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Project } from "@/lib/types";
import ProjectModal from "@/components/ProjectModal";
import { fetchProjects, fetchTags, queryKeys } from "@/lib/queries";

const GITHUB_PRESET = "amaralenja";
const VERCEL_PRESET = "amaralenja";

function RowSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-48 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-72" />
    </div>
  );
}

type AccountMode = "preset" | "custom";

export default function ProjetosPage() {
  const queryClient = useQueryClient();
  const [modalProjectId, setModalProjectId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagId, setTagId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [githubMode, setGithubMode] = useState<AccountMode>("preset");
  const [githubUser, setGithubUser] = useState(GITHUB_PRESET);
  const [githubCustom, setGithubCustom] = useState("");

  const [vercelMode, setVercelMode] = useState<AccountMode>("preset");
  const [vercelAccount, setVercelAccount] = useState(VERCEL_PRESET);
  const [vercelCustom, setVercelCustom] = useState("");

  const [projectUrl, setProjectUrl] = useState("");

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
  });

  const { data: tags = [], isLoading: loadingTags } = useQuery({
    queryKey: queryKeys.tags,
    queryFn: fetchTags,
  });

  const loading = loadingProjects || loadingTags;

  function resetForm() {
    setGithubMode("preset");
    setGithubUser(GITHUB_PRESET);
    setGithubCustom("");
    setVercelMode("preset");
    setVercelAccount(VERCEL_PRESET);
    setVercelCustom("");
    setProjectUrl("");
  }

  function openNew() {
    setEditing(null);
    setName("");
    setDescription("");
    setTagId(null);
    resetForm();
    setShowForm(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setName(p.name);
    setDescription(p.description);
    setTagId(p.tagId);

    if (p.githubUser) {
      if (p.githubUser === GITHUB_PRESET) {
        setGithubMode("preset");
        setGithubUser(GITHUB_PRESET);
      } else {
        setGithubMode("custom");
        setGithubCustom(p.githubUser);
      }
    } else {
      setGithubMode("preset");
      setGithubUser("");
      setGithubCustom("");
    }

    if (p.vercelAccount) {
      if (p.vercelAccount === VERCEL_PRESET) {
        setVercelMode("preset");
        setVercelAccount(VERCEL_PRESET);
      } else {
        setVercelMode("custom");
        setVercelCustom(p.vercelAccount);
      }
    } else {
      setVercelMode("preset");
      setVercelAccount("");
      setVercelCustom("");
    }

    setProjectUrl(p.projectUrl || "");
    setShowForm(true);
  }

  function getFinalGithub(): string | null {
    if (githubMode === "preset") return githubUser || null;
    return githubCustom.trim() || null;
  }

  function getFinalVercel(): string | null {
    if (vercelMode === "preset") return vercelAccount || null;
    return vercelCustom.trim() || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const body = {
      name,
      description,
      tagId,
      githubUser: getFinalGithub(),
      vercelAccount: getFinalVercel(),
      projectUrl: projectUrl.trim() || null,
    };

    if (editing) {
      await fetch(`/api/projects/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este projeto?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  }

  function getTag(id: string | null) {
    return tags.find((t) => t.id === id);
  }

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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
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
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descricao
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Sem status</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Links (opcionais)</p>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    GitHub
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={githubMode}
                      onChange={(e) => {
                        setGithubMode(e.target.value as AccountMode);
                        if (e.target.value === "preset") setGithubUser(GITHUB_PRESET);
                      }}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="">Nenhum</option>
                      <option value="preset">{GITHUB_PRESET} (padrao)</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    {githubMode === "custom" && (
                      <input
                        value={githubCustom}
                        onChange={(e) => setGithubCustom(e.target.value)}
                        placeholder="Seu usuario GitHub"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Vercel
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={vercelMode}
                      onChange={(e) => {
                        setVercelMode(e.target.value as AccountMode);
                        if (e.target.value === "preset") setVercelAccount(VERCEL_PRESET);
                      }}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="">Nenhum</option>
                      <option value="preset">{VERCEL_PRESET} (padrao)</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    {vercelMode === "custom" && (
                      <input
                        value={vercelCustom}
                        onChange={(e) => setVercelCustom(e.target.value)}
                        placeholder="Sua conta Vercel"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    URL do Projeto
                  </label>
                  <input
                    type="url"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
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
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
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
                    {p.githubUser && (
                      <span className="text-[10px] text-slate-400">@{p.githubUser}</span>
                    )}
                    {p.projectUrl && (
                      <span className="text-[10px] text-slate-400">URL</span>
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

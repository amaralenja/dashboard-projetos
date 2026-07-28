"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Project } from "@/lib/types";
import ProjectModal from "@/components/ProjectModal";
import { fetchProjects, fetchTags, queryKeys } from "@/lib/queries";
import { GitBranch, Cloud, ExternalLink, FileText, Clock, Plus, Pencil, Trash2, AlertCircle, FolderKanban } from "lucide-react";

const GITHUB_PRESET = "amaralenja";
const VERCEL_PRESET = "amaralenja";

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
        <div className="flex-1">
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-slate-100 rounded w-full mb-2" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
      <div className="flex gap-1 mt-4">
        <div className="h-5 bg-slate-100 rounded-full w-20" />
        <div className="h-5 bg-slate-100 rounded-full w-16" />
      </div>
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
  const [formError, setFormError] = useState("");

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
    setFormError("");
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
    setFormError("");
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
    setFormError("");

    const body = {
      name,
      description,
      tagId,
      githubUser: getFinalGithub(),
      vercelAccount: getFinalVercel(),
      projectUrl: projectUrl.trim() || null,
    };

    try {
      const url = editing ? `/api/projects/${editing.id}` : "/api/projects";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar projeto");
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      setSaving(false);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar");
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este projeto?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  }

  function getTag(id: string | null) {
    return tags.find((t) => t.id === id);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Projetos</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "" : `${projects.length} projeto(s) cadastrados`}
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all active:scale-95 inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Projeto
        </button>
      </div>

      {/* Filter bar */}
      {!loading && tags.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white">Todos</button>
          {tags.map((t) => (
            <button
              key={t.id}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editing ? "Editar Projeto" : "Novo Projeto"}
            </h3>

            {formError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Links (opcionais)</p>

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
                      className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                      className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving ? "Salvando..." : editing ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum projeto ainda</h3>
          <p className="text-sm text-slate-500 mb-4">Crie seu primeiro projeto para comecar.</p>
          <button
            onClick={openNew}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => {
            const tag = getTag(p.tagId);
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all group"
              >
                {/* Card body */}
                <button
                  onClick={() => setModalProjectId(p.id)}
                  className="w-full text-left p-5 pb-0"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: tag?.color || "#94a3b8" }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(p.createdAt)}
                      </p>
                    </div>
                  </div>

                  {p.description ? (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                      {p.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-300 italic mb-3">Sem descricao</p>
                  )}

                  {/* Tags row */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {tag ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500">
                        Sem status
                      </span>
                    )}
                    {p.commission !== null && p.commission > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700">
                        R$ {p.commission.toFixed(0)}
                      </span>
                    )}
                  </div>
                </button>

                {/* Separator */}
                <div className="border-t border-slate-100" />

                {/* Card footer */}
                <div className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {p.githubUser && (
                      <a
                        href={`https://github.com/${p.githubUser}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title={`GitHub @${p.githubUser}`}
                      >
                        <GitBranch size={15} />
                      </a>
                    )}
                    {p.vercelAccount && (
                      <a
                        href={`https://vercel.com/${p.vercelAccount}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title={`Vercel ${p.vercelAccount}`}
                      >
                        <Cloud size={15} />
                      </a>
                    )}
                    {p.projectUrl && (
                      <a
                        href={p.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Site do projeto"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    {!p.githubUser && !p.vercelAccount && !p.projectUrl && (
                      <span className="text-[10px] text-slate-300">Sem links</span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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

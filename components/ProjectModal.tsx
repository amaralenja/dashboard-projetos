"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Project, Tag, HistoryEntry, ProjectDocument } from "@/lib/types";
import {
  X, Smile, Reply, Pencil, Trash2, MoreHorizontal,
  ChevronRight, Send, Paperclip, Download, ExternalLink,
  GitBranch, Cloud, Upload,
} from "lucide-react";

interface Props {
  projectId: string;
  tags: Tag[];
  onClose: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const typeConfig: Record<string, { bg: string }> = {
  create: { bg: "bg-blue-100 text-blue-700" },
  status_change: { bg: "bg-amber-100 text-amber-700" },
  commission: { bg: "bg-emerald-100 text-emerald-700" },
  withdrawal: { bg: "bg-purple-100 text-purple-700" },
};

const QUICK_EMOJIS = ["👍", "👎", "❤", "😂", "😮", "😢", "🙏", "✅"];

export default function ProjectModal({ projectId, tags, onClose }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyTo, setReplyTo] = useState<HistoryEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [emojiPickerId, setEmojiPickerId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showDocs, setShowDocs] = useState(true);

  const backdropRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) setProject(await res.json());
    setLoading(false);
  }, [projectId]);

  const loadDocuments = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/documents`);
    if (res.ok) setDocuments(await res.json());
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadDocuments();
  }, [loadProject, loadDocuments]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [project?.history]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    function onClick() {
      setOpenMenuId(null);
      setEmojiPickerId(null);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function send(apiBody: Record<string, unknown>) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiBody),
    });
    loadProject();
  }

  async function saveNote() {
    if (!note.trim()) return;
    setSaving(true);
    await send({ note: note.trim(), replyTo: replyTo?.id || null });
    setNote("");
    setReplyTo(null);
    setSaving(false);
  }

  async function handleEditSave(entryId: string) {
    if (!editText.trim()) return;
    await send({ editEntryId: entryId, editText: editText.trim() });
    setEditingId(null);
    setEditText("");
  }

  async function handleDelete(entryId: string) {
    if (!confirm("Excluir esta mensagem?")) return;
    await send({ deleteEntryId: entryId });
    setOpenMenuId(null);
  }

  async function handleReact(entryId: string, emoji: string) {
    await send({ reactEntryId: entryId, emoji });
    setEmojiPickerId(null);
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });
    }

    setUploading(false);
    loadDocuments();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDownload(doc: ProjectDocument) {
    window.open(`/api/projects/${projectId}/documents/${doc.id}/download`, "_blank");
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm("Excluir este documento?")) return;
    await fetch(`/api/projects/${projectId}/documents/${docId}`, { method: "DELETE" });
    loadDocuments();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (editingId) {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleEditSave(editingId);
      }
    } else {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        saveNote();
      }
    }
  }

  function startReply(entry: HistoryEntry) {
    setReplyTo(entry);
    setOpenMenuId(null);
    setTimeout(() => noteInputRef.current?.focus(), 50);
  }

  function startEdit(entry: HistoryEntry) {
    setEditingId(entry.id);
    setEditText(entry.description);
    setOpenMenuId(null);
  }

  const tag = tags.find((t) => t.id === project?.tagId);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-xl">
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-xl">
          <p className="text-red-500">Projeto nao encontrado.</p>
          <button onClick={onClose} className="mt-3 text-sm text-slate-600 hover:underline">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const sortedHistory = [...project.history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const autoEvents = sortedHistory.filter((h) => h.type !== "note");
  const chatMessages = sortedHistory.filter((h) => h.type === "note");

  const hasLinks = project.githubUser || project.vercelAccount || project.projectUrl;

  function getReplyPreview(entryId: string | null | undefined) {
    if (!entryId) return null;
    const entry = project!.history.find((h) => h.id === entryId);
    return entry || null;
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{project.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>Criado em {formatDate(project.createdAt)}</span>
              {tag && (
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 ml-2 p-1 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links row */}
        {hasLinks && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-3 text-xs shrink-0 flex-wrap">
            {project.projectUrl && (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <ExternalLink size={12} />
                Site
              </a>
            )}
            {project.githubUser && (
              <a
                href={`https://github.com/${project.githubUser}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
              >
                <GitBranch size={12} />
                @{project.githubUser}
              </a>
            )}
            {project.vercelAccount && (
              <a
                href={`https://vercel.com/${project.vercelAccount}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
              >
                <Cloud size={12} />
                {project.vercelAccount}
              </a>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {/* Documents section */}
          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Documentos ({documents.length})
              </h4>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer">
                <Upload size={12} />
                {uploading ? "Enviando..." : "Anexar"}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-1 mb-3">Nenhum documento anexado.</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{doc.fileName}</span>
                      <span className="text-slate-400 shrink-0">{formatSize(doc.fileSize)}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline section */}
          {autoEvents.length > 0 && (
            <div className="px-5">
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 mb-2 flex items-center gap-1"
              >
                <ChevronRight
                  size={14}
                  className={`transition-transform ${showTimeline ? "rotate-90" : ""}`}
                />
                Historico de eventos
                <span className="text-slate-400 font-normal normal-case ml-1">
                  ({autoEvents.length})
                </span>
              </button>
              {showTimeline && (
                <div className="relative pl-5 border-l-2 border-slate-200 ml-1 mb-4">
                  {autoEvents.map((entry) => {
                    const cfg = typeConfig[entry.type] || typeConfig.create;
                    return (
                      <div key={entry.id} className="relative pb-3 last:pb-0">
                        <div
                          className={`absolute -left-[17px] top-0.5 w-[8px] h-[8px] rounded-full border-2 border-slate-50 ${cfg.bg}`}
                        />
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {entry.description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Chat messages */}
          <div className="px-4 pb-2 space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-8">
                Nenhuma mensagem ainda. Use o campo abaixo.
              </p>
            )}
            {chatMessages.map((entry) => {
              const replied = getReplyPreview(entry.replyTo);
              const isEditing = editingId === entry.id;
              const menuOpen = openMenuId === entry.id;
              const emojiOpen = emojiPickerId === entry.id;

              return (
                <div key={entry.id} className="flex justify-end">
                  <div className="relative group max-w-[80%]">
                    <div className="bg-emerald-500 text-white rounded-lg rounded-tr-sm px-3 py-2 shadow-sm">
                      {replied && (
                        <div className="bg-emerald-600 rounded px-2 py-1 mb-1.5 text-xs opacity-90 border-l-2 border-emerald-300">
                          <p className="font-medium text-[11px]">
                            {replied.type === "note"
                              ? replied.description.slice(0, 60) +
                                (replied.description.length > 60 ? "..." : "")
                              : replied.description}
                          </p>
                          <p className="text-[10px] mt-0.5 opacity-70">
                            {formatTime(replied.date)}
                          </p>
                        </div>
                      )}

                      {isEditing ? (
                        <div>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-white/10 rounded p-1.5 text-sm text-white placeholder-white/60 resize-none focus:outline-none border border-white/30"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-1.5 mt-1.5 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-[11px] text-white/70 hover:text-white px-2 py-0.5 rounded hover:bg-white/10"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleEditSave(entry.id)}
                              className="text-[11px] bg-white text-emerald-700 px-2 py-0.5 rounded font-medium"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {entry.description}
                        </p>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 text-right mt-0.5 mr-0.5">
                      {formatTime(entry.date)}
                    </p>

                    {entry.reactions && entry.reactions.length > 0 && (
                      <div className="flex gap-1 mt-0.5 justify-end">
                        {entry.reactions.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleReact(entry.id, emoji);
                            }}
                            className="text-xs bg-slate-200 hover:bg-slate-300 rounded-full px-1.5 py-0.5 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className={`absolute -top-8 right-0 bg-white border border-slate-200 rounded-lg shadow-md flex items-center gap-0.5 px-1 py-0.5 transition-opacity z-10 ${
                        menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setEmojiPickerId(emojiOpen ? null : entry.id);
                          setOpenMenuId(null);
                        }}
                        title="Reagir"
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Smile size={14} />
                      </button>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          startReply(entry);
                        }}
                        title="Responder"
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Reply size={14} />
                      </button>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          startEdit(entry);
                        }}
                        title="Editar"
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleDelete(entry.id);
                        }}
                        title="Excluir"
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setOpenMenuId(menuOpen ? null : entry.id);
                          setEmojiPickerId(null);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded sm:hidden"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>

                    {emojiOpen && (
                      <div className="absolute -top-10 right-0 bg-white border border-slate-200 rounded-lg shadow-md flex gap-0.5 px-1.5 py-1 z-20">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleReact(entry.id, emoji);
                            }}
                            className="p-0.5 text-base hover:bg-slate-100 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 p-3 shrink-0 bg-white">
          {replyTo && (
            <div className="mb-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-emerald-600">
                  Respondendo a:
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {replyTo.type === "note"
                    ? replyTo.description.slice(0, 80)
                    : replyTo.description}
                </p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-slate-400 hover:text-slate-600 ml-2 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <textarea
              ref={noteInputRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={2}
              placeholder="Digite uma mensagem..."
            />
            <button
              onClick={saveNote}
              disabled={saving || !note.trim()}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Ctrl+Enter para enviar
          </p>
        </div>
      </div>
    </div>
  );
}

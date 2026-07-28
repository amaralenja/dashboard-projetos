"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project, Tag, Withdrawal } from "@/lib/types";
import ProjectModal from "@/components/ProjectModal";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalProjectId, setModalProjectId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [pRes, tRes, wRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tags"),
        fetch("/api/withdrawals"),
      ]);
      setProjects(await pRes.json());
      setTags(await tRes.json());
      setWithdrawals(await wRes.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  const completingIds = tags.filter((t) => t.isCompleting).map((t) => t.id);
  const completedProjects = projects.filter(
    (p) => p.tagId && completingIds.includes(p.tagId)
  );

  const totalCommission = completedProjects.reduce(
    (sum, p) => sum + (p.commission || 0),
    0
  );
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const balance = totalCommission - totalWithdrawn;

  function getTag(id: string | null) {
    return tags.find((t) => t.id === id);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Início</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Total de Projetos</p>
          <p className="text-3xl font-bold mt-1">{projects.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Projetos Concluídos</p>
          <p className="text-3xl font-bold mt-1 text-green-600">
            {completedProjects.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Comissões Acumuladas</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            R$ {totalCommission.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Saldo Disponível</p>
          <p className="text-3xl font-bold mt-1 text-emerald-600">
            R$ {balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Projetos Recentes</h3>
          <Link
            href="/projetos"
            className="text-sm text-blue-600 hover:underline"
          >
            Ver todos
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="text-slate-400 text-sm">
            Nenhum projeto cadastrado ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">Nome</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((p) => {
                const tag = getTag(p.tagId);
                return (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4">
                      <button
                        onClick={() => setModalProjectId(p.id)}
                        className="text-blue-600 hover:underline text-left text-sm font-medium"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="py-2.5">
                      {tag ? (
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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

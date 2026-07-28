"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Project } from "@/lib/types";
import ProjectModal from "@/components/ProjectModal";
import { fetchProjects, fetchTags, fetchWithdrawals, queryKeys } from "@/lib/queries";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
      <div className="h-8 bg-slate-200 rounded w-16" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-slate-100 rounded" />
      ))}
    </div>
  );
}

export default function Home() {
  const [modalProjectId, setModalProjectId] = useState<string | null>(null);

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
  });

  const { data: tags = [], isLoading: loadingTags } = useQuery({
    queryKey: queryKeys.tags,
    queryFn: fetchTags,
  });

  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useQuery({
    queryKey: queryKeys.withdrawals,
    queryFn: fetchWithdrawals,
  });

  const loading = loadingProjects || loadingTags || loadingWithdrawals;

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
      <h2 className="text-2xl font-bold mb-6">Inicio</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">Total de Projetos</p>
              <p className="text-3xl font-bold mt-1">{projects.length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">Projetos Concluidos</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {completedProjects.length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">Comissoes Acumuladas</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">
                R$ {totalCommission.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">Saldo Disponivel</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600">
                R$ {balance.toFixed(2)}
              </p>
            </div>
          </>
        )}
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
        {loading ? (
          <TableSkeleton />
        ) : projects.length === 0 ? (
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

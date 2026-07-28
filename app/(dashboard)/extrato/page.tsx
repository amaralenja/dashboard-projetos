"use client";

import { useEffect, useState } from "react";
import { Project, Tag, Withdrawal } from "@/lib/types";

export default function ExtratoPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

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

  const closedProjects = projects.filter(
    (p) => p.tagId && completingIds.includes(p.tagId) && p.commission !== null
  );

  const totalCommission = closedProjects.reduce(
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
      <h2 className="text-2xl font-bold mb-6">Extrato Financeiro</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Comissões Totais</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            R$ {totalCommission.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Total de Saques</p>
          <p className="text-3xl font-bold mt-1 text-orange-600">
            R$ {totalWithdrawn.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Saldo Atual</p>
          <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            R$ {balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <h3 className="font-semibold">Projetos com Comissão</h3>
          </div>
          {closedProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhum projeto com comissão definida.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Projeto</th>
                  <th className="px-5 py-2.5 font-medium text-right">
                    Comissão
                  </th>
                </tr>
              </thead>
              <tbody>
                {closedProjects.map((p) => {
                  const tag = getTag(p.tagId);
                  return (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="px-5 py-2.5">
                        <span className="font-medium">{p.name}</span>
                        {tag && (
                          <span
                            className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right text-emerald-600 font-medium">
                        R$ {(p.commission || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <h3 className="font-semibold">Histórico de Saques</h3>
          </div>
          {withdrawals.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhum saque registrado.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Data</th>
                  <th className="px-5 py-2.5 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {[...withdrawals]
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((w) => (
                    <tr key={w.id} className="border-b border-slate-50">
                      <td className="px-5 py-2.5">
                        {new Date(w.date + "T00:00:00").toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right text-orange-600 font-medium">
                        - R$ {w.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

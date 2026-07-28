"use client";

import { useEffect, useState } from "react";
import { Project, Tag, Withdrawal } from "@/lib/types";

export default function ComissoesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [wdlDate, setWdlDate] = useState(new Date().toISOString().split("T")[0]);
  const [wdlAmount, setWdlAmount] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

  async function setCommission(projectId: string, value: number | null) {
    await fetch("/api/commissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, commission: value }),
    });
    loadData();
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(wdlAmount);
    if (!amount || amount <= 0) return;

    await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: wdlDate, amount }),
    });

    setWdlAmount("");
    setWdlDate(new Date().toISOString().split("T")[0]);
    setShowWithdrawForm(false);
    loadData();
  }

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Comissões</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Total em Comissões</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            R$ {totalCommission.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Total Sacado</p>
          <p className="text-3xl font-bold mt-1 text-orange-600">
            R$ {totalWithdrawn.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Saldo Atual</p>
          <p className="text-3xl font-bold mt-1 text-emerald-600">
            R$ {balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowWithdrawForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Registrar Saque
        </button>
      </div>

      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Registrar Saque</h3>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={wdlDate}
                  onChange={(e) => setWdlDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={wdlAmount}
                  onChange={(e) => setWdlAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                  placeholder="0,00"
                />
                {balance > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Saldo disponível: R$ {balance.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawForm(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold">Projetos Concluídos</h3>
          {completingIds.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Marque tags como &quot;finalizadora&quot; na página de Tags para
              liberar comissões.
            </p>
          )}
        </div>
        {completedProjects.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Nenhum projeto com status finalizador encontrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-5 py-2.5 font-medium">Projeto</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium w-40">Comissão (R$)</th>
              </tr>
            </thead>
            <tbody>
              {completedProjects.map((p) => {
                const tag = tags.find((t) => t.id === p.tagId);
                return (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="px-5 py-3">{p.name}</td>
                    <td className="px-5 py-3">
                      {tag && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={p.commission ?? ""}
                          onChange={(e) =>
                            setCommission(
                              p.id,
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value)
                            )
                          }
                          className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0,00"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

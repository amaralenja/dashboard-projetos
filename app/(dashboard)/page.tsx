"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchProjects, fetchTags, fetchWithdrawals, queryKeys } from "@/lib/queries";
import DateFilter, { type DateRange, type PresetKey, formatRangeLabel } from "@/components/DateFilter";
import { Project, Withdrawal } from "@/lib/types";

function getDateRange(key: PresetKey): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today": return { from: today, to: new Date(today.getTime() + 86399999) };
    case "yesterday": {
      const y = new Date(today.getTime() - 86400000);
      return { from: y, to: new Date(y.getTime() + 86399999) };
    }
    case "7d": return { from: new Date(today.getTime() - 6 * 86400000), to: new Date(today.getTime() + 86399999) };
    case "15d": return { from: new Date(today.getTime() - 14 * 86400000), to: new Date(today.getTime() + 86399999) };
    case "30d": return { from: new Date(today.getTime() - 29 * 86400000), to: new Date(today.getTime() + 86399999) };
    default: return { from: today, to: today };
  }
}

function inRange(dateStr: string, range: DateRange) {
  const d = new Date(dateStr).getTime();
  return d >= range.from.getTime() && d <= range.to.getTime();
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-20 mb-1" />
      <div className="h-3 bg-slate-100 rounded w-32" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 animate-pulse h-[300px] flex items-center justify-center">
      <div className="w-3/4 h-3/4 bg-slate-100 rounded" />
    </div>
  );
}

const PIECHART_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

export default function HomeDashboard() {
  const [activePreset, setActivePreset] = useState<PresetKey>("30d");
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRange("30d"));

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

  function handleDateChange(key: PresetKey, range: DateRange) {
    setActivePreset(key);
    setDateRange(range);
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => inRange(p.createdAt, dateRange));
  }, [projects, dateRange]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => inRange(w.createdAt, dateRange));
  }, [withdrawals, dateRange]);

  const completingIds = tags.filter((t) => t.isCompleting).map((t) => t.id);

  const filteredCompleted = filteredProjects.filter(
    (p) => p.tagId && completingIds.includes(p.tagId)
  );

  const totalCommission = filteredCompleted.reduce((s, p) => s + (p.commission || 0), 0);
  const totalWithdrawn = filteredWithdrawals.reduce((s, w) => s + w.amount, 0);
  const balance = totalCommission - totalWithdrawn;

  const statusDistribution = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    for (const p of projects) {
      const tag = tags.find((t) => t.id === p.tagId);
      const label = tag ? tag.name : "Sem status";
      if (!map[label]) {
        map[label] = { name: label, value: 0, color: tag?.color || "#94a3b8" };
      }
      map[label].value++;
    }
    return Object.values(map);
  }, [projects, tags]);

  const commissionHistory = useMemo(() => {
    const days: Record<string, { date: string; commissions: number; withdraws: number }> = {};
    const from = dateRange.from;
    const to = dateRange.to;
    const current = new Date(from);
    while (current <= to) {
      const key = current.toISOString().split("T")[0];
      days[key] = { date: key, commissions: 0, withdraws: 0 };
      current.setDate(current.getDate() + 1);
    }
    for (const p of projects) {
      for (const h of p.history) {
        if (h.type === "commission" && inRange(h.date, dateRange)) {
          const key = h.date.split("T")[0];
          if (days[key]) days[key].commissions += p.commission || 0;
        }
      }
    }
    for (const w of withdrawals) {
      if (inRange(w.createdAt, dateRange)) {
        const key = w.createdAt.split("T")[0];
        if (days[key]) days[key].withdraws += w.amount;
      }
    }
    return Object.values(days).map((d) => ({
      ...d,
      date: new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    }));
  }, [projects, withdrawals, dateRange]);

  const recentActivity = useMemo(() => {
    const items: { date: string; project: string; description: string; type: string }[] = [];
    for (const p of projects) {
      if (inRange(p.createdAt, dateRange)) {
        items.push({ date: p.createdAt, project: p.name, description: "Projeto criado", type: "create" });
      }
      for (const h of p.history) {
        if (inRange(h.date, dateRange)) {
          items.push({ date: h.date, project: p.name, description: h.description, type: h.type });
        }
      }
    }
    for (const w of filteredWithdrawals) {
      items.push({ date: w.createdAt, project: "—", description: `Saque de R$ ${w.amount.toFixed(2)}`, type: "withdrawal" });
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);
  }, [projects, filteredWithdrawals, dateRange]);

  function getTag(id: string | null) {
    return tags.find((t) => t.id === id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Inicio</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {activePreset === "custom" ? formatRangeLabel(dateRange) : `Ultimos ${activePreset === "today" ? "dia" : activePreset === "yesterday" ? "dia (ontem)" : activePreset === "7d" ? "7 dias" : activePreset === "15d" ? "15 dias" : "30 dias"}`}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <DateFilter active={activePreset} range={dateRange} onSelect={handleDateChange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Total Projetos</p>
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">geral</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Novos no periodo</p>
              <p className="text-2xl font-bold text-blue-600">{filteredProjects.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">criados</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Concluidos</p>
              <p className="text-2xl font-bold text-green-600">{filteredCompleted.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">no periodo</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Comissoes</p>
              <p className="text-2xl font-bold text-emerald-600">R$ {totalCommission.toFixed(0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">acumuladas</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Saques</p>
              <p className="text-2xl font-bold text-orange-600">R$ {totalWithdrawn.toFixed(0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">no periodo</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Saldo</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                R$ {balance.toFixed(0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">disponivel</p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Commission vs Withdrawals chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-4">Comissoes vs Saques</h3>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={commissionHistory} barGap={0} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value: unknown) => {
                    const v = typeof value === "number" ? value : 0;
                    return [`R$ ${v.toFixed(2)}`, ""];
                  }}
                />
                <Bar dataKey="commissions" fill="#22c55e" radius={[4, 4, 0, 0]} name="Comissoes" />
                <Bar dataKey="withdraws" fill="#f97316" radius={[4, 4, 0, 0]} name="Saques" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status distribution */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-4">Projetos por Status</h3>
          {loading ? (
            <ChartSkeleton />
          ) : statusDistribution.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
              Nenhum projeto cadastrado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value: unknown) => [`${value} projeto(s)`, ""]}
                />
                <Legend
                  formatter={(value: string) => <span className="text-xs">{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity table + Top projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <h3 className="font-semibold">Atividade Recente</h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Nenhuma atividade no periodo.
            </div>
          ) : (
            <div className="max-h-[340px] overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {recentActivity.map((item, i) => {
                    const typeColor =
                      item.type === "create" ? "bg-blue-100 text-blue-700" :
                      item.type === "commission" ? "bg-emerald-100 text-emerald-700" :
                      item.type === "status_change" ? "bg-amber-100 text-amber-700" :
                      item.type === "withdrawal" ? "bg-purple-100 text-purple-700" :
                      "bg-slate-100 text-slate-600";
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-2.5 w-[110px]">
                          <p className="text-xs text-slate-400">
                            {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(item.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                        <td className="px-5 py-2.5">
                          <p className="font-medium text-xs">{item.project}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColor}`}>
                            {item.type === "create" ? "Criado" :
                             item.type === "commission" ? "Comissao" :
                             item.type === "status_change" ? "Status" :
                             item.type === "withdrawal" ? "Saque" : "Nota"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top projects by commission */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold">Top Projetos por Comissao</h3>
            <Link href="/projetos" className="text-xs text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded" />
              ))}
            </div>
          ) : (
            <div className="max-h-[340px] overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {[...projects]
                    .filter((p) => p.commission !== null && p.commission > 0)
                    .sort((a, b) => (b.commission || 0) - (a.commission || 0))
                    .slice(0, 10)
                    .map((p) => {
                      const tag = getTag(p.tagId);
                      return (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-2.5">
                            <p className="font-medium text-xs">{p.name}</p>
                            {tag && (
                              <span
                                className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-2.5 text-right font-medium text-emerald-600 text-xs">
                            R$ {(p.commission || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {projects.filter((p) => p.commission !== null && p.commission > 0).length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400">
                  Nenhum projeto com comissao definida.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

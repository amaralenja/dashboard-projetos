"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export type DateRange = {
  from: Date;
  to: Date;
};

export type PresetKey = "today" | "yesterday" | "7d" | "15d" | "30d" | "custom";

const presets: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "15d", label: "15 dias" },
  { key: "30d", label: "30 dias" },
];

function getDateRange(key: PresetKey): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return { from: today, to: new Date(today.getTime() + 86399999) };
    case "yesterday": {
      const y = new Date(today.getTime() - 86400000);
      return { from: y, to: new Date(y.getTime() + 86399999) };
    }
    case "7d":
      return { from: new Date(today.getTime() - 6 * 86400000), to: new Date(today.getTime() + 86399999) };
    case "15d":
      return { from: new Date(today.getTime() - 14 * 86400000), to: new Date(today.getTime() + 86399999) };
    case "30d":
      return { from: new Date(today.getTime() - 29 * 86400000), to: new Date(today.getTime() + 86399999) };
    default:
      return { from: today, to: today };
  }
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, from: Date, to: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const t = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return d >= f && d <= t;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrev - i),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return days;
}

interface Props {
  active: PresetKey;
  range: DateRange;
  onSelect: (key: PresetKey, range: DateRange) => void;
}

export function formatRangeLabel(range: DateRange): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  return `${fmt(range.from)} – ${fmt(range.to)}`;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export default function DateFilter({ active, range, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | null>(null);
  const [tempTo, setTempTo] = useState<Date | null>(null);
  const [picking, setPicking] = useState<"from" | "to">("from");
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function click(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, [open]);

  function openCustom() {
    setTempFrom(range.from);
    setTempTo(range.to);
    setPicking("from");
    setViewMonth(range.from.getMonth());
    setViewYear(range.from.getFullYear());
    setOpen(true);
  }

  function selectDay(date: Date) {
    if (picking === "from") {
      setTempFrom(date);
      setTempTo(null);
      setPicking("to");
    } else {
      if (tempFrom && date < tempFrom) {
        setTempFrom(date);
        setTempTo(null);
        setPicking("to");
      } else {
        setTempTo(date);
      }
    }
  }

  function apply() {
    if (tempFrom && tempTo) {
      const toEnd = new Date(tempTo.getTime() + 86399999);
      onSelect("custom", { from: tempFrom, to: toEnd });
    }
    setOpen(false);
  }

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const month1Days = getMonthDays(viewYear, viewMonth);
  const secondMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const secondYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const month2Days = getMonthDays(secondYear, secondMonth);

  const today = new Date();
  const effectiveFrom = tempFrom || range.from;
  const effectiveTo = tempTo || range.to;

  return (
    <div className="relative flex items-center gap-2 flex-wrap">
      {presets.map((p) => {
        const activeBtn = active === p.key;
        return (
          <button
            key={p.key}
            onClick={() => onSelect(p.key, getDateRange(p.key))}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeBtn
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        );
      })}

      <div className="relative" ref={popupRef}>
        <button
          onClick={() => (open ? setOpen(false) : openCustom())}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            active === "custom"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Calendar size={14} />
          {active === "custom" ? formatRangeLabel(range) : "Personalizado"}
        </button>

        {open && (
          <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 w-[560px]">
            <div className="flex gap-4">
              {/* Month 1 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={goPrevMonth} className="p-1 hover:bg-slate-100 rounded">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-sm font-medium">
                    {MONTHS[viewMonth]} {viewYear}
                  </span>
                  <div className="w-5" />
                </div>
                <div className="grid grid-cols-7 text-center mb-1">
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="text-[10px] text-slate-400 font-medium py-1">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {month1Days.map((d, i) => {
                    const isToday = isSameDay(d.date, today);
                    const isFrom = tempFrom && isSameDay(d.date, tempFrom);
                    const isTo = tempTo && isSameDay(d.date, tempTo);
                    const inRange = tempFrom && tempTo && isInRange(d.date, tempFrom, tempTo);
                    return (
                      <button
                        key={i}
                        onClick={() => d.isCurrentMonth && selectDay(d.date)}
                        disabled={!d.isCurrentMonth}
                        className={`h-8 text-xs rounded transition-colors ${
                          !d.isCurrentMonth
                            ? "text-slate-300 cursor-default"
                            : isFrom || isTo
                            ? "bg-slate-900 text-white font-medium"
                            : inRange
                            ? "bg-slate-100 text-slate-900"
                            : isToday
                            ? "text-slate-900 font-semibold bg-slate-50 hover:bg-slate-100"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {d.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month 2 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-5" />
                  <span className="text-sm font-medium">
                    {MONTHS[secondMonth]} {secondYear}
                  </span>
                  <button onClick={goNextMonth} className="p-1 hover:bg-slate-100 rounded">
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-7 text-center mb-1">
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="text-[10px] text-slate-400 font-medium py-1">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {month2Days.map((d, i) => {
                    const isFrom = tempFrom && isSameDay(d.date, tempFrom);
                    const isTo = tempTo && isSameDay(d.date, tempTo);
                    const inRange = tempFrom && tempTo && isInRange(d.date, tempFrom, tempTo);
                    return (
                      <button
                        key={i}
                        onClick={() => d.isCurrentMonth && selectDay(d.date)}
                        disabled={!d.isCurrentMonth}
                        className={`h-8 text-xs rounded transition-colors ${
                          !d.isCurrentMonth
                            ? "text-slate-300 cursor-default"
                            : isFrom || isTo
                            ? "bg-slate-900 text-white font-medium"
                            : inRange
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {d.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                {tempFrom
                  ? tempTo
                    ? `${tempFrom.toLocaleDateString("pt-BR")} – ${tempTo.toLocaleDateString("pt-BR")}`
                    : `${tempFrom.toLocaleDateString("pt-BR")} – ...`
                  : "Selecione o periodo"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={apply}
                  disabled={!tempFrom || !tempTo}
                  className="px-4 py-1.5 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

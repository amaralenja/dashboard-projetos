import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "Dashboard - Projetos e Comissões",
  description: "Dashboard de gerenciamento de projetos e comissões",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex h-screen overflow-hidden">
        <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-700">
            <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">Projetos & Comissões</p>
          </div>
          <nav className="flex-1 p-3">
            <NavLinks />
          </nav>
          <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
            Dados salvos localmente
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Início", icon: "▦" },
  { href: "/projetos", label: "Projetos", icon: "▤" },
  { href: "/tags", label: "Tags / Status", icon: "◉" },
  { href: "/comissoes", label: "Comissões", icon: "$" },
  { href: "/extrato", label: "Extrato", icon: "▥" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-slate-700 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-base w-5 text-center">{link.icon}</span>
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

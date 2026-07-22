"use client";

import Link from "next/link";
import { ArrowLeftRight, ChartLine, ClipboardCheck, House, PackageCheck, Plus, UserRound, Users, UsersRound } from "lucide-react";
import { views } from "./constants";

const navIcons = {
  dashboard: House,
  borrowers: UsersRound,
  equipment: PackageCheck,
  transactions: ArrowLeftRight,
  returns: ClipboardCheck,
  profile: UserRound,
  users: Users,
};

function DockLink({ view, activeView }) {
  const Icon = navIcons[view.icon] || ChartLine;
  const active = activeView === view.label;
  return (
    <Link
      className={`inline-flex min-h-12 min-w-12 justify-self-center items-center justify-center gap-2 rounded-xl px-3 text-sm font-black no-underline !transition-none !animate-none ${active ? "bg-[#087f78] text-white" : "text-[#5d6a68]"}`}
      href={view.href}
      style={{ animation: "none", transition: "none" }}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.6} />
      <span className="hidden sm:block">{view.label}</span>
    </Link>
  );
}

export function BottomNav({ activeView, user }) {
  const visibleViews = views.filter(
    (view) => !view.roles || view.roles.includes(user?.role),
  );
  const dockViews = visibleViews.filter(
    (view) => !["profile", "users", "returns"].includes(view.icon),
  );
  const leftViews = dockViews.slice(0, Math.ceil(dockViews.length / 2));
  const rightViews = dockViews.slice(Math.ceil(dockViews.length / 2));

  return (
    <nav className="fixed right-3 bottom-3 left-3 z-30 grid grid-cols-[minmax(0,1fr)_58px_minmax(0,1fr)] items-center rounded-2xl border border-[#dce5e3] bg-white/95 p-2 shadow-[0_12px_30px_rgba(20,33,31,0.16)] backdrop-blur-xl !transition-none !animate-none sm:left-1/2 sm:w-[min(calc(100%-36px),760px)] sm:-translate-x-1/2" style={{ animation: "none", transition: "none" }}>
      <div className="col-start-1 row-start-1 grid grid-cols-2 gap-1">
        <>
          {leftViews.map((view) => (
            <DockLink key={view.label} view={view} activeView={activeView} />
          ))}
        </>
      </div>
      <Link
        className="relative col-start-2 row-start-1 grid h-12 w-12 place-self-center place-items-center rounded-xl border border-[#0f766e] bg-[#087f78] text-xl text-white no-underline shadow-[0_12px_26px_rgba(8,127,120,0.24)] !transition-none !animate-none"
        href="/transactions?issue=1"
        aria-label="Lend equipment"
        title="Lend equipment"
        onClick={() => window.dispatchEvent(new Event("openIssueEquipment"))}
        style={{ animation: "none", transition: "none" }}
      >
        <Plus strokeWidth={2.8} />
      </Link>
      <div className="col-start-3 row-start-1 grid grid-cols-2 gap-1">
        <>
          {rightViews.map((view) => (
            <DockLink key={view.label} view={view} activeView={activeView} />
          ))}
        </>
      </div>
    </nav>
  );
}

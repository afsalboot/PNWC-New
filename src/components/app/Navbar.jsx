"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, UserRound, Users } from "lucide-react";

export function Navbar({ activeView, canViewUsers, user, logout, hidden }) {
  const showProfileLink = activeView !== "Profile";
  const showLogout = activeView === "Profile";

  return (
    <header className={`fixed top-3 left-1/2 z-30 flex w-[min(calc(100%-24px),1200px)] -translate-x-1/2 items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-4 py-2 shadow-[0_12px_30px_rgba(20,33,31,0.12)] backdrop-blur-xl transition-transform duration-200 ${hidden ? "-translate-y-24" : "translate-y-0"}`}>
      <div className="flex min-w-0 items-center gap-3">
        <Image src="/Logo.jpeg" alt="PNWC logo" width={46} height={46} priority className="h-11 w-11 rounded-xl object-cover" />
        <div className="min-w-0">
          <strong className="block text-lg font-black text-[#17201f]">PNWC</strong>
          <span className="block truncate text-sm font-bold text-[#667572]">Hospital Equipment Lending</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canViewUsers && (
          <Link className={`grid h-10 w-10 place-items-center rounded-xl border border-[#dce5e3] ${activeView === "Users" ? "bg-[#087f78] text-white" : "bg-white text-[#17201f]"}`} href="/users" aria-label="Users" title="Users">
            <Users className="h-4 w-4" />
          </Link>
        )}
        {showProfileLink && (
          <Link className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-[#dce5e3] bg-white text-[#17201f]" href="/profile" aria-label="Profile" title={user ? `Profile ${user.name}` : "Profile"}>
            {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4" />}
          </Link>
        )}
        {showLogout && (
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-700" aria-label="Logout" title="Logout" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

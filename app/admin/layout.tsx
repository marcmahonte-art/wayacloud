"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Users, HardDrive, CreditCard, FileText,
  MessageCircle, Activity, Settings, Shield, BarChart3,
  ChevronRight, LogOut, Menu, X,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/Logo"

const adminNav = [
  { href: "/admin", label: "CEO Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/storage", label: "Stockage", icon: HardDrive },
  { href: "/admin/files", label: "Fichiers", icon: FileText },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/admin/analytics", label: "Analytiques", icon: BarChart3 },
  { href: "/admin/activity", label: "Activité", icon: Activity },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="shrink-0">
        <Logo className="w-[160px] text-[#111827]" />
      </Link>

      <div className="mt-2 mb-4 px-3 py-1.5 rounded-lg bg-[#FFF0E8] text-[11px] font-bold text-primary uppercase tracking-wider">
        Super Admin
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {adminNav.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-[#69708A] hover:bg-[#F5F3F0] hover:text-dark",
              )}
            >
              <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto shrink-0 space-y-1 pt-4 border-t border-[#ECE7DF]">
        <Link
          href="/dashboard"
          className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium text-[#69708A] hover:bg-[#F5F3F0] hover:text-dark transition-all"
        >
          <ChevronRight size={14} />
          Retour au dashboard
        </Link>
        <button
          onClick={() => router.push("/login")}
          className="flex w-full h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <aside className="fixed left-0 top-0 hidden h-screen w-[220px] flex-col border-r border-[#ECE7DF] bg-white px-3 py-5 lg:flex">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] transform border-r border-[#ECE7DF] bg-white shadow-2xl transition-transform duration-300 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-end mb-2">
            <button onClick={() => setMobileOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#69708A] hover:bg-[#F5F3F0]">
              <X size={18} />
            </button>
          </div>
          {sidebar}
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#ECE7DF] bg-white/90 backdrop-blur px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#69708A] hover:bg-[#F5F3F0] lg:hidden">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-[13px] text-[#69708A] font-medium">
              <span className="hidden sm:inline">Administration</span>
              {adminNav.find(n => isActive(n.href, n.exact)) && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-dark font-semibold">
                    {adminNav.find(n => isActive(n.href, n.exact))?.label}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 items-center rounded-full bg-green-50 px-2.5 text-[11px] font-semibold text-green-700">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
              En direct
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

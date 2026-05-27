"use client";

import { useState } from "react";
import {
  Album,
  Bell,
  CircleHelp,
  FileText,
  Folder,
  Gift,
  Home,
  Image as ImageIcon,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Share2,
  Trash2,
  UserPlus,
  X,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UploadButton } from "@/components/dashboard/UploadButton";
import { useAuth } from "@/providers/AuthProvider";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

const navigation = [
  { href: "/dashboard", label: "Tableau de bord", icon: Home },
  { href: "/mes-fichiers", label: "Mes fichiers", icon: Folder },
  { href: "/whatsapp", label: "Sauvegarde WhatsApp", icon: MessageCircle },
  { href: "/albums", label: "Albums", icon: ImageIcon },
  { href: "/partages", label: "Partages", icon: Share2 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/corbeille", label: "Corbeille", icon: Trash2 },
];

const bottomLinks = [
  { href: "/referral", label: "Parrainage", icon: UserPlus },
  { href: "/gift", label: "Offrir", icon: Gift },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

function getInitials(firstName?: string | null, lastName?: string | null, fullName?: string | null): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (fullName) return fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  return "??"
}

function bytesToGo(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(1)
}

function percentUsed(used: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, storageQuota: initialQuota, subscription, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveQuota, setLiveQuota] = useState(initialQuota);

  const storageQuota = liveQuota || initialQuota;

  useRealtimeSync(user?.id, {
    onQuotaChange: (quota: any) => setLiveQuota(quota),
  });

  const profileFirstName = typeof profile?.first_name === "string" ? profile.first_name : ""
  const profileLastName = typeof profile?.last_name === "string" ? profile.last_name : ""
  const profileFullName = typeof profile?.full_name === "string" ? profile.full_name : ""

  const firstName = profileFirstName || profileFullName?.split(" ")[0] || "Utilisateur"
  const displayName = profileFirstName && profileLastName
    ? `${profileFirstName} ${profileLastName}`
    : profileFullName || "Utilisateur"
  const userEmail = typeof profile?.email === "string" ? profile.email : ""
  const initials = getInitials(profileFirstName || null, profileLastName || null, profileFullName || null)

  const usedGo = storageQuota ? bytesToGo(storageQuota.storage_used_bytes) : "0"
  const limitGo = storageQuota ? bytesToGo(storageQuota.storage_limit_bytes) : "20"
  const usagePercent = storageQuota ? percentUsed(storageQuota.storage_used_bytes, storageQuota.storage_limit_bytes) : 0

  const isActive = (href: string) => pathname === href || (href === "/dashboard" && pathname === "/");

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="block shrink-0">
        <Image
          src="/assets/waya-logo.png"
          alt="WayaCloud"
          width={210}
          height={64}
          priority
          className="h-auto w-[170px]"
        />
      </Link>

      <nav className="mt-7 flex-1 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex h-11 items-center gap-3 rounded-card px-4 text-[14px] font-semibold transition-all ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-[#171B34] hover:bg-background hover:text-primary"
              }`}
            >
              <item.icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0">
        <div className="mb-6">
          <div className="flex items-center justify-between text-[12px] font-semibold">
            <span className="text-[#69708A] uppercase tracking-wider">Stockage</span>
            <span className="text-dark">{usedGo} Go / {limitGo} Go</span>
          </div>
          <div className="mt-2.5 h-1.5 rounded-full bg-[#EFEAF6]">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-[#69708A]">{usagePercent}% utilisé</p>
        </div>

        {subscription && (
          <Link
            href="/abonnement"
            className="mb-6 block rounded-card border border-[#E8DCF8] bg-[#FAF6FF] p-4 transition-colors hover:bg-[#F5EEFF]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#4B18C9] leading-tight">
                  {subscription?.plan_name === "Gratuit" || !subscription?.plan_price
                    ? "Passez au plan Essentiel 20 Go"
                    : subscription?.plan_name === "Essentiel"
                    ? "Passez au plan Famille 100 Go"
                    : "Passez au plan Business 500 Go"}
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-[#596077]">
                  {subscription?.plan_name === "Gratuit" || !subscription?.plan_price
                    ? "Stockez vos premiers fichiers en toute sécurité."
                    : subscription?.plan_name === "Essentiel"
                    ? "Parfait pour toute la famille."
                    : "Pour les professionnels et entreprises."}
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-white shadow-sm">
                <Album size={17} className="text-primary" />
              </span>
            </div>
          </Link>
        )}

        {bottomLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex h-11 items-center gap-3 rounded-card px-4 text-[14px] font-semibold transition-all mb-1 ${
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-[#69708A] hover:bg-background hover:text-dark"
            }`}
          >
            <item.icon size={18} strokeWidth={1.8} />
            {item.label}
          </Link>
        ))}

        <div className="mt-3 flex items-center gap-3 rounded-card p-2 hover:bg-background transition-colors cursor-pointer" onClick={() => { logout(); router.push("/login"); }} role="button" tabIndex={0} aria-label="Se déconnecter">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE8D9] text-sm font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-dark">{displayName}</p>
            <p className="truncate text-[11px] text-[#69708A]">{userEmail}</p>
          </div>
          <LogOut size={16} className="text-[#69708A]" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFAF8] text-dark">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[250px] flex-col border-r border-[#ECE7DF] bg-white/90 px-4 py-6 lg:flex xl:w-[270px] xl:px-5">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-[#ECE7DF] bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between mb-5">
            <Image
              src="/assets/waya-logo.png"
              alt="WayaCloud"
              width={160}
              height={48}
              priority
              className="h-auto w-[140px]"
            />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#69708A] hover:bg-[#F5F3F0] transition-colors"
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
          </div>
          {sidebar}
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[250px] xl:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-transparent bg-[#FBFAF8]/90 px-4 py-3 backdrop-blur sm:px-5 lg:px-7 xl:px-9">
          <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 lg:min-w-[200px]">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#69708A] hover:bg-[#F5F3F0] transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-[#10142D] sm:text-2xl">
                  Bonjour, {firstName} !
                </h1>
                <p className="mt-0.5 truncate text-[13px] text-[#596077] hidden sm:block">
                  Voici un aperçu complet de ton espace WayaCloud.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <label className="hidden sm:flex h-10 min-w-0 max-w-[320px] flex-1 items-center gap-2.5 rounded-card border border-[#E3DFE8] bg-white px-3.5 shadow-sm">
                <Search size={17} className="text-[#516080] shrink-0" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#69708A]"
                  placeholder="Rechercher un fichier, un dossier..."
                />
                <span className="hidden rounded-md bg-[#F3F1F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#69708A] lg:inline">
                  Ctrl+K
                </span>
              </label>
              <button className="relative hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E3DFE8] bg-white shadow-sm hover:shadow transition-shadow">
                <Bell size={18} />
                <span className="absolute right-1.5 top-1 rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                  3
                </span>
              </button>
              <button className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E3DFE8] bg-white shadow-sm hover:shadow transition-shadow">
                <CircleHelp size={18} />
              </button>
              <UploadButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1560px] min-w-0 px-4 pb-20 sm:px-5 lg:px-7 xl:px-9 sm:pb-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-[#ECE7DF] bg-white/95 backdrop-blur px-2 py-2 lg:hidden">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors min-w-0 ${
                  active ? "text-primary" : "text-[#69708A] hover:text-dark"
                }`}
              >
                <item.icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[11px] font-semibold leading-tight text-center">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

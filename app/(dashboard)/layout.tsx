"use client";

import {
  Album,
  Bell,
  CircleHelp,
  FileText,
  Folder,
  Home,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UploadButton } from "@/components/dashboard/UploadButton";
import { useAuth } from "@/providers/AuthProvider";

const navigation = [
  { href: "/dashboard", label: "Tableau de bord", icon: Home },
  { href: "/mes-fichiers", label: "Mes fichiers", icon: Folder },
  { href: "/whatsapp", label: "Sauvegarde WhatsApp", icon: MessageCircle },
  { href: "/albums", label: "Albums", icon: ImageIcon },
  { href: "/partages", label: "Partages", icon: Share2 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/corbeille", label: "Corbeille", icon: Trash2 },
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
  const { profile, storageQuota, profileLoading } = useAuth();

  const firstName = profile?.first_name || profile?.full_name?.split(" ")[0] || "Utilisateur"
  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.full_name || "Utilisateur"
  const userEmail = profile?.email || ""
  const initials = getInitials(profile?.first_name, profile?.last_name, profile?.full_name)

  const usedGo = storageQuota ? bytesToGo(storageQuota.storage_used_bytes) : "0"
  const limitGo = storageQuota ? bytesToGo(storageQuota.storage_limit_bytes) : "20"
  const usagePercent = storageQuota ? percentUsed(storageQuota.storage_used_bytes, storageQuota.storage_limit_bytes) : 0

  return (
    <div className="min-h-screen bg-[#FBFAF8] text-dark">
      <aside className="fixed left-0 top-0 hidden h-screen w-[264px] flex-col overflow-y-auto border-r border-[#ECE7DF] bg-white/90 px-5 py-7 lg:flex xl:w-[282px] xl:px-6">
        <Link href="/dashboard" className="block">
          <Image
            src="/assets/waya-logo.png"
            alt="WayaCloud"
            width={210}
            height={64}
            priority
            className="h-auto w-[190px]"
          />
        </Link>

        <nav className="mt-9 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-12 items-center gap-3 rounded-card px-4 text-[15px] font-semibold transition ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-[#171B34] hover:bg-background hover:text-primary"
                }`}
              >
                <item.icon size={20} strokeWidth={1.9} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase text-[#69708A]">
              Espace utilisé
            </p>
            <div className="mt-4 flex items-center justify-between text-sm font-bold">
              <span>{usedGo} Go / {limitGo} Go</span>
            </div>
            <div className="mt-3 h-2 rounded-pill bg-[#EFEAF6]">
              <div className="h-full rounded-pill bg-primary" style={{ width: `${usagePercent}%` }} />
            </div>
            <p className="mt-3 text-xs font-medium text-[#69708A]">{usagePercent}% utilisé</p>
          </div>

          <div className="rounded-card border border-[#E8DCF8] bg-[#FAF6FF] p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-[#4B18C9]">
                  Passez au plan Famille 50 Go
                </p>
                <p className="mt-3 text-sm leading-6 text-[#596077]">
                  Plus d&apos;espace pour vos souvenirs.
                </p>
              </div>
              <span className="rounded-btn bg-white p-2 text-primary shadow-card">
                <Album size={19} />
              </span>
            </div>
            <button className="mt-5 h-11 w-full rounded-btn border border-[#7B45F5] text-sm font-bold text-[#5A21DD]">
              Découvrir les plans
            </button>
          </div>

          <div className="mt-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE8D9] text-sm font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-dark">{displayName}</p>
              <p className="truncate text-xs text-[#69708A]">{userEmail}</p>
            </div>
            <button className="rounded-btn p-2 text-[#69708A] hover:bg-background">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[264px] xl:pl-[282px]">
        <header className="sticky top-0 z-20 border-b border-transparent bg-[#FBFAF8]/90 px-4 py-4 backdrop-blur sm:px-5 lg:px-7 xl:px-9">
          <div className="mx-auto flex max-w-[1560px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#10142D]">
                Bonjour, {firstName} !
              </h1>
              <p className="mt-1 text-sm text-[#596077]">
                Voici un aperçu complet de ton espace WayaCloud.
              </p>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-3 lg:justify-end">
              <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-card border border-[#E3DFE8] bg-white px-4 shadow-card lg:max-w-[430px]">
                <Search size={19} className="text-[#516080]" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#69708A]"
                  placeholder="Rechercher un fichier, un dossier..."
                />
                <span className="rounded-md bg-[#F3F1F7] px-2 py-1 text-xs font-semibold text-[#69708A]">
                  Ctrl + K
                </span>
              </label>
              <button className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E3DFE8] bg-white shadow-card sm:flex">
                <Bell size={20} />
                <span className="absolute right-2 top-1 rounded-pill bg-primary px-1.5 text-[10px] font-bold text-white">
                  3
                </span>
              </button>
              <button className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E3DFE8] bg-white shadow-card sm:flex">
                <CircleHelp size={20} />
              </button>
              <UploadButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1560px] min-w-0 px-4 pb-8 sm:px-5 lg:px-7 xl:px-9">{children}</main>
      </div>
    </div>
  );
}

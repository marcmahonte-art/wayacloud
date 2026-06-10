import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Share2, Link, Clock, Download, Globe, Lock } from "lucide-react"

interface ShareLink {
  id: string
  token_hash: string
  file_id: string
  created_at: string
  expires_at: string | null
  max_downloads: number
  download_count: number
  link_type: string
  permission: string
  revoked_at: string | null
  file_name: string
  file_size_bytes: number
  file_mime_type: string
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} Go`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} Mo`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${bytes} o`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const day = 86400000

  if (diff < day) return "Aujourd'hui"
  if (diff < 2 * day) return "Hier"
  if (diff < 7 * day) return `Il y a ${Math.floor(diff / day)} jours`
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith("image/")) return "Image"
  if (mimeType?.startsWith("video/")) return "Video"
  if (mimeType?.startsWith("audio/")) return "Audio"
  if (mimeType?.startsWith("text/")) return "Document"
  if (mimeType?.includes("pdf")) return "PDF"
  if (mimeType?.includes("zip") || mimeType?.includes("rar") || mimeType?.includes("tar")) return "Archive"
  return "Fichier"
}

function getStatus(link: ShareLink): { label: string; color: string } {
  if (link.revoked_at) return { label: "Révoqué", color: "text-red-600 bg-red-50" }
  if (link.expires_at && new Date(link.expires_at) < new Date()) return { label: "Expiré", color: "text-orange-600 bg-orange-50" }
  if (link.download_count >= link.max_downloads) return { label: "Limite atteinte", color: "text-yellow-600 bg-yellow-50" }
  return { label: "Actif", color: "text-green-600 bg-green-50" }
}

export default async function PartagesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/connexion?redirect=/partages")
  }

  const { data: shares } = await supabase
    .from("share_links")
    .select(`
      id,
      token_hash,
      file_id,
      created_at,
      expires_at,
      max_downloads,
      download_count,
      link_type,
      permission,
      revoked_at,
      files:file_id (name, size_bytes, mime_type)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  const shareLinks: ShareLink[] = (shares ?? []).map((s: any) => ({
    id: s.id,
    token_hash: s.token_hash,
    file_id: s.file_id,
    created_at: s.created_at,
    expires_at: s.expires_at,
    max_downloads: s.max_downloads,
    download_count: s.download_count,
    link_type: s.link_type,
    permission: s.permission,
    revoked_at: s.revoked_at,
    file_name: s.files?.name ?? "Fichier inconnu",
    file_size_bytes: s.files?.size_bytes ?? 0,
    file_mime_type: s.files?.mime_type ?? "",
  }))

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Mes Partages</h1>
          <p className="mt-1 text-sm text-[#596077]">Gérez les fichiers que vous avez partagés.</p>
        </div>
      </div>

      {shareLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#ECE7DF] bg-white py-20 shadow-sm">
          <Share2 size={48} className="text-slate-300" />
          <p className="mt-4 text-[15px] font-semibold text-slate-500">Aucun fichier partagé</p>
          <p className="mt-1 text-sm text-slate-400">Partagez un fichier pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shareLinks.map((link) => {
            const status = getStatus(link)
            return (
              <div key={link.id} className="flex items-center gap-4 rounded-xl border border-[#ECE7DF] bg-white p-4 shadow-sm transition hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F0EB] text-lg">
                  {getFileIcon(link.file_mime_type)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-dark">{link.file_name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#69708A]">
                    <span className="flex items-center gap-1">
                      <Download size={12} />
                      {link.download_count}/{link.max_downloads}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(link.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      {link.link_type === "public" ? <Globe size={12} /> : <Lock size={12} />}
                      {link.link_type === "public" ? "Public" : "Privé"}
                    </span>
                    <span>{formatFileSize(link.file_size_bytes)}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${status.color}`}>
                  {status.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

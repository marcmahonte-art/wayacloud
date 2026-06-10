"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Link, Copy, Check, Clock, Loader2, AlertCircle } from "lucide-react"
import { type FileCardData } from "@/components/dashboard/FileCard"

interface ShareDialogProps {
  isOpen: boolean
  file: FileCardData | null
  onClose: () => void
}

const EXPIRATIONS = [
  { label: "1 jour", value: "1d" },
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
  { label: "Jamais", value: "never" },
]

export function ShareDialog({ isOpen, file, onClose }: ShareDialogProps) {
  const [expiration, setExpiration] = useState("7d")
  const [copied, setCopied] = useState(false)
  const [linkType, setLinkType] = useState<"public" | "private">("public")
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const createShareLink = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setError("")
    setShareUrl(null)

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          expiresIn: expiration,
          linkType,
          permission: "download",
          maxDownloads: 10,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Erreur de création du lien")
      }

      const data = await res.json()
      setShareUrl(data.shareUrl)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }, [file, expiration, linkType])

  useEffect(() => {
    if (isOpen && file) {
      createShareLink()
    } else {
      setShareUrl(null)
      setError("")
      setCopied(false)
    }
  }, [isOpen, file, createShareLink])

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (!isOpen || !file) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-[#eae5e0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link size={20} />
            </span>
            <div>
              <h2 className="text-[17px] font-bold text-[#1c1b1b]">Partager</h2>
              <p className="text-[12px] text-[#69708a] font-medium truncate max-w-[250px]">{file.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#69708a] hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-5 space-y-5">
          {/* Link type */}
          <div>
            <label className="text-[12px] font-semibold text-[#69708a] mb-2 block">Type de lien</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLinkType("public")}
                className={`flex-1 rounded-xl border py-2.5 text-[13px] font-semibold transition-colors ${
                  linkType === "public"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-[#e3dfe8] text-[#4a4a4a] hover:bg-[#f5f3f0]"
                }`}
              >
                Lien public
              </button>
              <button
                onClick={() => setLinkType("private")}
                className={`flex-1 rounded-xl border py-2.5 text-[13px] font-semibold transition-colors ${
                  linkType === "private"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-[#e3dfe8] text-[#4a4a4a] hover:bg-[#f5f3f0]"
                }`}
              >
                Lien privé
              </button>
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="text-[12px] font-semibold text-[#69708a] mb-2 flex items-center gap-1.5">
              <Clock size={14} />
              Expiration
            </label>
            <div className="flex gap-2">
              {EXPIRATIONS.map((exp) => (
                <button
                  key={exp.value}
                  onClick={() => setExpiration(exp.value)}
                  className={`flex-1 rounded-xl border py-2 text-[12px] font-semibold transition-colors ${
                    expiration === exp.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-[#e3dfe8] text-[#4a4a4a] hover:bg-[#f5f3f0]"
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Copy link */}
          <div>
            <label className="text-[12px] font-semibold text-[#69708a] mb-2 block">Lien de partage</label>

            {loading ? (
              <div className="flex items-center justify-center rounded-xl border border-[#e3dfe8] bg-[#fbfaf8] px-4 py-4">
                <Loader2 size={18} className="animate-spin text-primary" />
                <span className="ml-2 text-[13px] text-[#69708a]">Création du lien...</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span className="text-[12px] text-red-600">{error}</span>
              </div>
            ) : shareUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-[#e3dfe8] bg-[#fbfaf8] px-4 py-3 text-[12px] text-[#4a4a4a] truncate font-mono">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    disabled={!shareUrl}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-50"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                {copied && <p className="mt-1.5 text-[12px] font-medium text-green-600">Lien copié !</p>}
              </>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-[#e3dfe8] bg-[#fbfaf8] px-4 py-4">
                <span className="text-[13px] text-[#69708a]">Lien non disponible</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

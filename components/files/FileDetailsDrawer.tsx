"use client"

import { useEffect } from "react"
import { X, Calendar, HardDrive, FileType, User, Clock, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatFileSize, type FileCardData } from "@/components/dashboard/FileCard"

interface FileDetailsDrawerProps {
  file: FileCardData | null
  onClose: () => void
  ownerName?: string
}

export function FileDetailsDrawer({ file, onClose, ownerName }: FileDetailsDrawerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {file && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl border-l border-[#ece7df]"
          >
            <div className="flex flex-col h-full">
              <header className="flex items-center justify-between px-6 py-4 border-b border-[#ece7df]">
                <h3 className="text-[16px] font-bold text-[#1c1b1b]">Détails</h3>
                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#69708a] hover:bg-black/5 transition-colors">
                  <X size={18} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6" style={{ scrollbarWidth: "thin" }}>
                {/* File icon preview */}
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm">
                    <FileType size={28} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-bold text-[#1c1b1b] break-all leading-5">{file.name}</h4>
                    <p className="text-[12px] text-[#69708a] font-medium mt-0.5">
                      {formatFileSize(file.size_bytes)}
                    </p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="space-y-3">
                  <DetailRow icon={FileType} label="Type" value={file.mime_type || "Inconnu"} />
                  <DetailRow icon={HardDrive} label="Taille" value={formatFileSize(file.size_bytes)} />
                  <DetailRow icon={Calendar} label="Créé le" value={new Date(file.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
                  <DetailRow icon={Clock} label="Modifié le" value={new Date(file.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
                  {ownerName && <DetailRow icon={User} label="Propriétaire" value={ownerName} />}
                  {file.url && (
                    <DetailRow icon={ExternalLink} label="URL" value="Lien disponible" />
                  )}
                </div>

                {/* ID */}
                {file.id && (
                  <div className="rounded-xl bg-[#fbfaf8] border border-[#ece7df] p-3">
                    <p className="text-[11px] font-semibold text-[#69708a] uppercase tracking-wider mb-1">ID</p>
                    <p className="text-[12px] text-[#4a4a4a] font-mono break-all">{file.id}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#f1ede6] last:border-0">
      <Icon size={16} className="text-[#69708a] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#69708a] uppercase tracking-wider">{label}</p>
        <p className="text-[13px] font-medium text-[#1c1b1b] break-all mt-0.5">{value}</p>
      </div>
    </div>
  )
}

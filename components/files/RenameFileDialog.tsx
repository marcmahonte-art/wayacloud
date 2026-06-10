"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"

interface RenameFileDialogProps {
  isOpen: boolean
  fileName: string
  onClose: () => void
  onConfirm: (newName: string) => Promise<boolean>
}

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/

export function RenameFileDialog({ isOpen, fileName, onClose, onConfirm }: RenameFileDialogProps) {
  const [name, setName] = useState(fileName)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(fileName)
    setError("")
  }, [fileName, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Le nom ne peut pas être vide.")
      return
    }
    if (INVALID_CHARS.test(trimmed)) {
      setError("Caractères invalides : < > : \" / \\ | ? *")
      return
    }
    if (trimmed === fileName) {
      onClose()
      return
    }
    setLoading(true)
    const success = await onConfirm(trimmed)
    setLoading(false)
    if (success) onClose()
    else setError("Erreur lors du renommage.")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl border border-[#eae5e0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-[17px] font-bold text-[#1c1b1b]">Renommer</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#69708a] hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-5 space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-[#69708a] mb-1.5 block">Nouveau nom</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError("") }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl border border-[#e3dfe8] bg-white px-4 py-3 text-[14px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-colors"
              placeholder="Nom du fichier"
            />
            {error && <p className="mt-1.5 text-[12px] font-medium text-red-500">{error}</p>}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#e3dfe8] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#4a4a4a] hover:bg-[#f5f3f0] transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-bold text-white hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Renommer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

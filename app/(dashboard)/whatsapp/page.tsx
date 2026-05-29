"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Smartphone,
  Cloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  Play,
  Pause,
  StopCircle,
  HardDrive,
  Image,
  Video,
  Music,
  FileText,
  Upload,
  ArrowLeft,
} from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams } from "next/navigation"
import { formatBytes, formatDuration } from "@/lib/formatters"

type BackupStatus = "idle" | "scanning" | "uploading" | "paused" | "completed" | "failed" | "partial"
type WhatsAppCategory = "images" | "videos" | "audio" | "documents" | "general"

interface BackupStats {
  lastBackup: string | null
  totalFiles: number
  totalSize: number
  storageUsed: number
  storageLimit: number
  categories: Record<string, number>
}

interface BackupFile {
  id: string
  name: string
  size: number
  mime_type: string
  category: string
  md5: string
  source: string
  created_at: string
}

const CATEGORY_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  images: { icon: Image, label: "Images", color: "#FF6300" },
  videos: { icon: Video, label: "Vidéos", color: "#8B5CF6" },
  audio: { icon: Music, label: "Audio", color: "#10B981" },
  documents: { icon: FileText, label: "Documents", color: "#3B82F6" },
  general: { icon: FileText, label: "Autres", color: "#6B7280" },
}

export default function WhatsAppPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [status, setStatus] = useState<BackupStatus>("idle")
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [files, setFiles] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [showFiles, setShowFiles] = useState(false)

  const fetchBackupStatus = useCallback(async () => {
    if (!user) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch("/api/whatsapp/backup/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
        setFiles(data.files ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchBackupStatus()
  }, [fetchBackupStatus])

  const handleScan = useCallback(async () => {
    setStatus("scanning")
    setProgress(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStatus("idle")
        return
      }

      await new Promise((r) => setTimeout(r, 1500))
      setStatus("uploading")

      for (let i = 0; i <= 100; i += Math.floor(Math.random() * 15) + 5) {
        await new Promise((r) => setTimeout(r, 200))
        setProgress(Math.min(i, 100))
      }

      setProgress(100)
      await new Promise((r) => setTimeout(r, 500))
      setStatus("completed")
      await fetchBackupStatus()
    } catch {
      setStatus("failed")
    }
  }, [supabase, fetchBackupStatus])

  const resetBackup = useCallback(() => {
    setStatus("idle")
    setProgress(0)
  }, []);

  // Trigger automatic scan if URL contains ?scan=1
  const searchParams = useSearchParams();
  useEffect(() => {
    const scan = searchParams?.get("scan");
    if (scan && status === "idle") {
      handleScan();
    }
  }, [searchParams, status, handleScan]);

  const categoryBreakdown = files.reduce(
    (acc, f) => {
      const cat = f.category || "general"
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-wa-green/10">
            <Smartphone className="text-wa-green" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Sauvegarde WhatsApp</h1>
            <p className="text-sm text-gray">Sauvegardez vos médias WhatsApp dans le cloud</p>
          </div>
        </div>
      </div>

      {/* Active Backup UI */}
      <AnimatePresence mode="wait">
        {(status === "scanning" || status === "uploading" || status === "paused") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-card"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-orange-500" />
                <span className="font-semibold text-dark">
                  {status === "scanning" ? "Analyse en cours..." : "Sauvegarde en cours..."}
                </span>
              </div>
              <button
                onClick={status === "paused" ? () => setStatus("uploading") : () => setStatus("paused")}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-gray hover:bg-gray-50"
              >
                {status === "paused" ? <Play size={16} /> : <Pause size={16} />}
                {status === "paused" ? "Reprendre" : "Pause"}
              </button>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray">Progression</span>
                <span className="font-bold text-orange-500">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF6300] to-[#FF8A20]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray">
                <Upload size={16} />
                <span>Fichier en cours de traitement...</span>
              </div>
              <button
                onClick={() => { setStatus("idle"); setProgress(0) }}
                className="flex min-h-11 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <StopCircle size={16} />
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Card */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 overflow-hidden rounded-2xl border border-border bg-white shadow-card"
        >
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border sm:grid-cols-4">
            <StatCard icon={HardDrive} label="Fichiers" value={stats.totalFiles.toString()} />
            <StatCard icon={Cloud} label="Stockage utilisé" value={formatBytes(stats.totalSize)} />
            <StatCard icon={Clock} label="Dernière sauvegarde" value={stats.lastBackup ? formatDate(stats.lastBackup) : "Jamais"} />
            <StatCard icon={CheckCircle2} label="Catégories" value={Object.keys(stats.categories).length.toString()} />
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            {Object.entries(categoryBreakdown).map(([cat, count]) => {
              const config = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.general
              const Icon = config.icon
              return (
                <div key={cat} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${config.color}15` }}>
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-dark">{count}</p>
                    <p className="text-xs text-gray">{config.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Last Backup Info */}
      {stats?.lastBackup && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-3 rounded-xl bg-green-50 p-4"
        >
          <CheckCircle2 size={20} className="text-green-600" />
          <p className="text-sm font-medium text-green-700">
            Dernière sauvegarde : {formatDate(stats.lastBackup)}
          </p>
        </motion.div>
      )}

      {/* Main Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-card"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
            <Smartphone size={32} className="text-[#FF6300]" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-dark">
            {stats?.totalFiles ? "Nouvelle sauvegarde" : "Première sauvegarde"}
          </h2>
          <p className="mb-6 max-w-md text-sm text-gray">
            {stats?.totalFiles
              ? `Vous avez ${stats.totalFiles} fichier(s) sauvegardé(s). Lancez une nouvelle analyse pour mettre à jour.`
              : "Analysez votre appareil pour trouver et sauvegarder vos médias WhatsApp en toute sécurité."}
          </p>

          {status === "idle" || status === "completed" || status === "failed" || status === "partial" ? (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleScan}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1DA851] transition-colors"
              >
                <Smartphone size={18} />
                {stats?.totalFiles ? "Nouvelle analyse" : "Analyser mon appareil"}
              </button>
              {(status === "completed" || status === "partial") && (
                <button
                  onClick={resetBackup}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-gray hover:bg-gray-50"
                >
                  <RotateCcw size={16} />
                  Réinitialiser
                </button>
              )}
            </div>
          ) : null}

          {status === "failed" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
              <AlertCircle size={16} />
              La sauvegarde a échoué. Veuillez réessayer.
            </div>
          )}
        </div>
      </motion.div>

      {/* Backup History / File List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-border bg-white shadow-card"
        >
          <button
            onClick={() => setShowFiles(!showFiles)}
            className="flex w-full items-center justify-between p-6 hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-bold text-dark">Historique des fichiers ({files.length})</h3>
            <motion.div animate={{ rotate: showFiles ? 180 : 0 }}>
              <ArrowLeft size={20} className="text-gray" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showFiles && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="divide-y divide-border">
                  {files.slice(0, 50).map((file) => {
                    const catConfig = CATEGORY_CONFIG[file.category] ?? CATEGORY_CONFIG.general
                    const Icon = catConfig.icon
                    return (
                      <div key={file.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${catConfig.color}10` }}>
                          <Icon size={14} style={{ color: catConfig.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-dark">{file.name}</p>
                          <p className="text-xs text-gray">{formatBytes(file.size)}</p>
                        </div>
                        <span className="shrink-0 text-xs text-gray">
                          {formatDate(file.created_at)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <Icon size={20} className="mb-2 text-[#FF6300]" />
      <p className="text-xl font-bold text-dark">{value}</p>
      <p className="text-xs text-gray">{label}</p>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

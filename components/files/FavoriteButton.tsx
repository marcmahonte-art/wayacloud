"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  isFavorite: boolean
  onToggle: () => void
  size?: number
}

export function FavoriteButton({ isFavorite, onToggle, size = 16 }: FavoriteButtonProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      className={cn(
        "flex items-center justify-center rounded-md transition-all hover:scale-110",
        isFavorite ? "text-yellow-500" : "text-[#d0d0d0] hover:text-yellow-400",
      )}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Star size={size} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  )
}

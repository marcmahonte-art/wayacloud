"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  Eye, Download, Share2, Info, Pencil, Move, Copy,
  Tag, Star, Trash2, FileX, CornerDownRight,
  FileText, FileImage, Play, FileAudio, Folder,
} from "lucide-react";

export interface FileItem {
  id?: string;
  name: string;
  url: string;
  type: string;
  size?: string;
  meta?: string;
  time?: string;
  color?: string;
  iconName?: string;
  is_favorite?: boolean;
  color_label?: string | null;
}

interface MenuAction {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  danger?: boolean;
  divider?: boolean;
  group?: string;
}

const menuGroups: { label: string; items: MenuAction[] }[] = [
  {
    label: "actions",
    items: [
      { id: "open", label: "Ouvrir", icon: Eye, shortcut: "⏎" },
      { id: "download", label: "Télécharger", icon: Download, shortcut: "⌘D" },
      { id: "share", label: "Partager", icon: Share2, shortcut: "⌘S" },
    ],
  },
  {
    label: "details",
    items: [
      { id: "info", label: "Informations", icon: Info, shortcut: "⌘I", divider: true },
      { id: "rename", label: "Renommer", icon: Pencil },
      { id: "move", label: "Déplacer vers", icon: Move },
      { id: "copy", label: "Copier vers", icon: Copy },
    ],
  },
  {
    label: "organize",
    items: [
      { id: "label", label: "Étiquette / Couleur", icon: Tag, shortcut: "⌘L", divider: true },
      { id: "favorite", label: "Ajouter aux favoris", icon: Star },
    ],
  },
  {
    label: "danger",
    items: [
      { id: "trash", label: "Déplacer vers la corbeille", icon: Trash2, danger: true, divider: true },
      { id: "delete", label: "Supprimer définitivement", icon: FileX, danger: true },
    ],
  },
];

const labelColors = [
  { name: "Rouge", color: "#EF4444" },
  { name: "Orange", color: "#F97316" },
  { name: "Jaune", color: "#EAB308" },
  { name: "Vert", color: "#22C55E" },
  { name: "Bleu", color: "#3B82F6" },
  { name: "Violet", color: "#8B5CF6" },
  { name: "Rose", color: "#EC4899" },
  { name: "Gris", color: "#6B7280" },
];

interface FileContextMenuProps {
  file: FileItem;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (actionId: string, file: FileItem) => void;
  mode?: "dropdown" | "contextmenu";
}

export function FileContextMenu({
  file,
  isOpen,
  position,
  onClose,
  onAction,
  mode = "contextmenu",
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [menuPosition, setMenuPosition] = useState(position);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewport = {
        w: window.innerWidth,
        h: window.innerHeight,
      };

      let x = position.x;
      let y = position.y;

      if (x + rect.width > viewport.w - 16) {
        x = viewport.w - rect.width - 16;
      }
      if (y + rect.height > viewport.h - 16) {
        y = viewport.h - rect.height - 16;
      }

      setMenuPosition({ x, y });
    }
  }, [isOpen, position]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLabels(false);
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (file.type) {
      case "image": return FileImage;
      case "video": return Play;
      case "audio": return FileAudio;
      case "pdf": return FileText;
      default: return FileText;
    }
  };

  const IconComp = getIcon();

  const handleAction = (actionId: string) => {
    if (actionId === "label") {
      setShowLabels(!showLabels);
      return;
    }
    if (actionId === "favorite") {
      setIsFavorite(!isFavorite);
      onAction(actionId, file);
      return;
    }
    onAction(actionId, file);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
      }}
      className="fixed z-[60] w-[260px] origin-top-right"
    >
      <div className="overflow-hidden rounded-xl border border-[#EAE5E0] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm">
        <div className="px-3 py-2.5 border-b border-[#F0ECE6]">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${file.color || "bg-blue-100 text-blue-600"}`}>
              <IconComp size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-dark truncate leading-tight">
                {file.name}
              </p>
              <p className="text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                {file.size || file.meta?.split(" • ")[0] || ""}
              </p>
            </div>
          </div>
        </div>

        <div className="py-1.5">
          {menuGroups.map((group) => (
            <div key={group.label}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Fragment key={item.id}>
                    {item.divider && (
                      <div className="my-1 border-t border-[#F0ECE6]" />
                    )}
                    <button
                      onClick={() => handleAction(item.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-[13px] transition-colors
                        ${item.danger
                          ? "text-red-600 hover:bg-red-50"
                          : "text-[#4A4A4A] hover:bg-[#F5F3F0]"
                        } ${item.id === "favorite" && isFavorite ? "text-amber-500" : ""}
                      `}
                    >
                      <span className="flex w-5 items-center justify-center shrink-0">
                        <Icon size={16} strokeWidth={1.8} />
                      </span>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[11px] text-[#B0B0B0] font-medium">{item.shortcut}</span>
                      )}
                    </button>
                    {item.id === "label" && showLabels && (
                      <div className="mx-3 mb-1.5 mt-1 p-2 rounded-lg bg-[#FAF9F7] border border-[#F0ECE6]">
                        <div className="flex flex-wrap gap-1.5">
                          {labelColors.map((l) => (
                            <button
                              key={l.color}
                              onClick={() => {
                                setSelectedLabel(l.color === selectedLabel ? null : l.color);
                              }}
                              className={`h-6 w-6 rounded-full border-2 transition-all ${
                                selectedLabel === l.color
                                  ? "border-dark scale-110"
                                  : "border-transparent hover:scale-110"
                              }`}
                              style={{ backgroundColor: l.color }}
                              title={l.name}
                            />
                          ))}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="text-[#9CA3AF] font-medium">
                            {selectedLabel ? "Étiquette appliquée" : "Choisir une couleur"}
                          </span>
                          {selectedLabel && (
                            <button
                              onClick={() => setSelectedLabel(null)}
                              className="text-red-500 hover:text-red-600 font-semibold"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ContextMenuTriggerProps {
  children: React.ReactNode;
  onOpen: (e: React.MouseEvent) => void;
}

export function ContextMenuTrigger({ children, onOpen }: ContextMenuTriggerProps) {
  return (
    <div onContextMenu={(e) => { e.preventDefault(); onOpen(e); }}>
      {children}
    </div>
  );
}

"use client";

import { ImageIcon, MoreVertical, Plus, Users, Play, Lock } from "lucide-react";
import Image from "next/image";

const albums = [
  {
    id: 1,
    title: "Vacances Ouaga 2026",
    itemCount: 42,
    shared: false,
    date: "12 Mai 2026",
    covers: [
      "https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=300&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?q=80&w=300&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517400508447-f8dd518b86db?q=80&w=300&auto=format&fit=crop",
    ],
  },
  {
    id: 2,
    title: "Famille Traoré",
    itemCount: 156,
    shared: true,
    date: "Modifié hier",
    covers: [
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=300&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1541893949449-3663a8e977c0?q=80&w=300&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=300&auto=format&fit=crop",
    ],
  },
  {
    id: 3,
    title: "Captures d'écran",
    itemCount: 8,
    shared: false,
    date: "Il y a 3 jours",
    covers: [
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=300&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571210862729-78a52d3779a2?q=80&w=300&auto=format&fit=crop",
    ],
  },
  {
    id: 4,
    title: "Vidéos de mariage",
    itemCount: 12,
    shared: true,
    date: "Avril 2026",
    covers: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop",
    ],
    isVideo: true,
  },
];

export default function AlbumsPage() {
  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">
            Mes Albums
          </h1>
          <p className="mt-1 text-sm text-[#596077]">
            Organisez vos souvenirs et retrouvez-les facilement.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card transition-colors hover:bg-violet-700">
          <Plus size={18} />
          Nouvel Album
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {albums.map((album) => (
          <div
            key={album.id}
            className="group cursor-pointer rounded-[20px] bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-card border border-[#ECE7DF]"
          >
            <div className="relative mb-4 aspect-square overflow-hidden rounded-[14px] bg-slate-100">
              {album.covers.length >= 3 ? (
                <div className="grid h-full grid-cols-2 grid-rows-2 gap-1">
                  <div className="relative row-span-2">
                    <Image src={album.covers[0]} alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src={album.covers[1]} alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src={album.covers[2]} alt="" fill className="object-cover" />
                  </div>
                </div>
              ) : album.covers.length === 2 ? (
                <div className="grid h-full grid-cols-2 gap-1">
                  <div className="relative">
                    <Image src={album.covers[0]} alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src={album.covers[1]} alt="" fill className="object-cover" />
                  </div>
                </div>
              ) : (
                <div className="relative h-full w-full">
                  <Image src={album.covers[0]} alt="" fill className="object-cover" />
                  {album.isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-md">
                        <Play className="ml-1 text-white" size={24} fill="white" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-dark backdrop-blur-md">
                {album.itemCount} éléments
              </div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-dark group-hover:text-primary transition-colors">
                  {album.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#69708A]">
                  <span>{album.date}</span>
                  <span>•</span>
                  {album.shared ? (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Users size={12} />
                      <span>Partagé</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Lock size={12} />
                      <span>Privé</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#69708A] hover:bg-slate-100 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

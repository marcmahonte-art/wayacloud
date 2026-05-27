"use client";

import { Loader2 } from "lucide-react";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`min-h-[220px] animate-pulse rounded-card bg-white p-6 shadow-card ${className}`}>
      <div className="space-y-4">
        <div className="h-4 w-24 rounded-md bg-[#E5E2E1]" />
        <div className="h-8 w-32 rounded-md bg-[#E5E2E1]" />
        <div className="h-3 w-20 rounded-md bg-[#E5E2E1]" />
        <div className="mt-6 h-2 w-full rounded-full bg-[#E5E2E1]" />
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded-md bg-[#E5E2E1]" />
          <div className="h-8 w-28 rounded-md bg-[#E5E2E1]" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonFileRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-lg px-4 py-3">
      <div className="h-10 w-10 shrink-0 rounded-lg bg-[#E5E2E1]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/5 rounded-md bg-[#E5E2E1]" />
        <div className="h-2 w-1/4 rounded-md bg-[#E5E2E1]" />
      </div>
      <div className="h-2 w-16 rounded-md bg-[#E5E2E1]" />
      <div className="h-2 w-20 rounded-md bg-[#E5E2E1]" />
    </div>
  );
}

export function SkeletonFileGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-[#E5E2E1] bg-white p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#E5E2E1]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-4/5 rounded-md bg-[#E5E2E1]" />
              <div className="h-2 w-2/5 rounded-md bg-[#E5E2E1]" />
            </div>
          </div>
          <div className="h-2 w-3/5 rounded-md bg-[#E5E2E1]" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonActivityItem() {
  return (
    <div className="flex animate-pulse items-center gap-3 py-2">
      <div className="h-5 w-5 shrink-0 rounded-md bg-[#E5E2E1]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-2/5 rounded-md bg-[#E5E2E1]" />
        <div className="h-2 w-3/5 rounded-md bg-[#E5E2E1]" />
      </div>
      <div className="h-2 w-14 rounded-md bg-[#E5E2E1]" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-1">
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="space-y-4">
        <div className="h-5 w-32 animate-pulse rounded-md bg-[#E5E2E1]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 rounded-card border border-[#ECE7DF] bg-white p-4">
              <div className="h-10 w-10 shrink-0 rounded-card bg-[#E5E2E1]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-4/5 rounded-md bg-[#E5E2E1]" />
                <div className="h-2 w-2/5 rounded-md bg-[#E5E2E1]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center pt-32">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-[#69708A]">Chargement...</p>
      </div>
    </div>
  );
}

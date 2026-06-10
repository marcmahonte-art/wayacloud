import React from 'react';
import { formatBytes } from "@/lib/formatters";

export default function StorageProgress({ usedBytes, limitBytes }: { usedBytes: number; limitBytes: number }) {
  const percent = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;
  const usedDisplay = formatBytes(usedBytes);
  const limitDisplay = formatBytes(limitBytes);

  return (
    <div className="mt-2 w-full max-w-md">
      <div className="flex justify-between text-sm text-[#69708A] mb-1">
        <span>{usedDisplay} / {limitDisplay}</span>
        <span>{percent}% utilisé</span>
      </div>
      <div className="h-3 w-full rounded-full bg-[#E3DFE8] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

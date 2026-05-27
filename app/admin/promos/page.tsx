"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Trash2, Loader2, Tag } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState(20);
  const [newMaxUses, setNewMaxUses] = useState(100);
  const [newValidDays, setNewValidDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const fetchPromos = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/promos");
    if (res.ok) setPromos(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleCreate = async () => {
    if (!newCode || newDiscount <= 0) return;
    setSaving(true);
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newCode,
        discountPercent: newDiscount,
        maxUses: newMaxUses,
        validDays: newValidDays,
      }),
    });
    if (res.ok) {
      setNewCode(""); setNewDiscount(20); setNewMaxUses(100); setNewValidDays(30);
      await fetchPromos();
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/promos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    await fetchPromos();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dark">Codes Promo</h1>
        <p className="mt-1 text-sm text-gray">Gérez les codes de réduction</p>
      </div>

      <div className="rounded-2xl border border-[#ECE7DF] bg-white p-6 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#69708A]">
          Nouveau code
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-5">
          <div>
            <label className="text-xs font-semibold text-[#69708A]">Code</label>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="PROMO20"
              className="mt-1 w-full rounded-lg border border-[#E3DFE8] px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#69708A]">%</label>
            <input
              type="number"
              value={newDiscount}
              onChange={(e) => setNewDiscount(parseInt(e.target.value) || 0)}
              min={1} max={100}
              className="mt-1 w-full rounded-lg border border-[#E3DFE8] px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#69708A]">Max utilisations</label>
            <input
              type="number"
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 0)}
              min={1}
              className="mt-1 w-full rounded-lg border border-[#E3DFE8] px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#69708A]">Valable (jours)</label>
            <input
              type="number"
              value={newValidDays}
              onChange={(e) => setNewValidDays(parseInt(e.target.value) || 1)}
              min={1}
              className="mt-1 w-full rounded-lg border border-[#E3DFE8] px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-bold text-white transition hover:bg-primary-light disabled:opacity-70"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Créer
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {promos.length === 0 ? (
          <p className="text-center text-sm text-[#69708A] py-10">
            Aucun code promo pour le moment
          </p>
        ) : (
          promos.map((promo) => (
            <div
              key={promo.id}
              className="flex items-center justify-between rounded-xl border border-[#ECE7DF] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Tag size={18} className="text-primary" />
                </span>
                <div>
                  <p className="font-bold text-dark">{promo.code}</p>
                  <p className="text-xs text-[#69708A]">
                    {promo.discount_percent}% &middot; {promo.used_count}/{promo.max_uses} utilisations
                    {promo.valid_until && ` &middot; Expire le ${new Date(promo.valid_until).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(promo.id, promo.is_active)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                  promo.is_active
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {promo.is_active ? "Actif" : "Inactif"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

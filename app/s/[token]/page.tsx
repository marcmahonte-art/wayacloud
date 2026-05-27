import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { SharePageClient } from "./SharePageClient";

interface PageProps {
  params: { token: string };
}

export default async function SharePage({ params }: PageProps) {
  const supabase = createAdminSupabaseClient();

  const { data: link } = await supabase
    .from("share_links")
    .select("id, file_id, expires_at, max_downloads, download_count, revoked_at")
    .eq("token_hash", params.token)
    .single();

  if (!link) notFound();

  if (link.revoked_at || new Date(link.expires_at) < new Date() || link.download_count >= link.max_downloads) {
    notFound();
  }

  const { data: file } = await supabase
    .from("files")
    .select("name, size_bytes, mime_type")
    .eq("id", link.file_id)
    .single();

  if (!file) notFound();

  const { data: owner } = await supabase
    .from("share_links")
    .select("owner_id")
    .eq("id", link.id)
    .single();

  let ownerName = "Utilisateur WayaCloud";
  if (owner) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", owner.owner_id)
      .single();
    if (profile?.full_name) ownerName = profile.full_name;
  }

  const sizeMb = (file.size_bytes / (1024 * 1024)).toFixed(1);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FBFAF8] to-[#F5F0EB] px-4">
      <section className="w-full max-w-md rounded-2xl border border-[#ECE7DF] bg-white p-8 shadow-card">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-center text-xl font-bold text-dark truncate">{file.name}</h1>
        <p className="mt-1 text-center text-sm text-[#69708A]">{sizeMb} Mo</p>
        <p className="mt-1 text-center text-xs text-[#69708A]">Partagé par {ownerName}</p>
        <SharePageClient token={params.token} fileName={file.name} />
        <footer className="mt-6 border-t border-[#ECE7DF] pt-4 text-center text-xs text-[#69708A]">
          Sécurisé par WayaCloud &middot; Chiffré de bout en bout
        </footer>
      </section>
    </main>
  );
}

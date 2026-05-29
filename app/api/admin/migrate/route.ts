import { NextResponse } from "next/server";

const MIGRATION_SECRET = process.env.MIGRATION_SECRET || "";

export async function POST(request: Request) {
  const { secret } = await request.json().catch(() => ({}));
  if (!secret || secret !== MIGRATION_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY non définie. Veuillez la définir dans les variables d'environnement Vercel." },
      { status: 500 },
    );
  }

  const fullMigration = `
-- Enhanced files table columns
ALTER TABLE IF EXISTS public.files
  ADD COLUMN IF NOT EXISTS md5 TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS s3_key TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'deleted', 'archived'));

CREATE INDEX IF NOT EXISTS idx_files_md5 ON public.files(md5);
CREATE INDEX IF NOT EXISTS idx_files_user_source ON public.files(user_id, source);
CREATE INDEX IF NOT EXISTS idx_files_user_category ON public.files(user_id, category);

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS last_whatsapp_backup TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.whatsapp_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),
  total_files INTEGER NOT NULL DEFAULT 0,
  uploaded_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  uploaded_bytes BIGINT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_backups_user ON public.whatsapp_backups(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_backups_status ON public.whatsapp_backups(status);

ALTER TABLE public.whatsapp_backups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own backups" ON public.whatsapp_backups;
CREATE POLICY "Users can view own backups" ON public.whatsapp_backups FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own backups" ON public.whatsapp_backups;
CREATE POLICY "Users can insert own backups" ON public.whatsapp_backups FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own backups" ON public.whatsapp_backups;
CREATE POLICY "Users can update own backups" ON public.whatsapp_backups FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.whatsapp_backup_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID NOT NULL REFERENCES public.whatsapp_backups(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  md5 TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'uploaded', 'duplicate', 'failed')),
  s3_key TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wbf_backup ON public.whatsapp_backup_files(backup_id);
CREATE INDEX IF NOT EXISTS idx_wbf_user ON public.whatsapp_backup_files(user_id);
CREATE INDEX IF NOT EXISTS idx_wbf_md5 ON public.whatsapp_backup_files(md5);

ALTER TABLE public.whatsapp_backup_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own backup files" ON public.whatsapp_backup_files;
CREATE POLICY "Users can view own backup files" ON public.whatsapp_backup_files FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own backup files" ON public.whatsapp_backup_files;
CREATE POLICY "Users can insert own backup files" ON public.whatsapp_backup_files FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own backup files" ON public.whatsapp_backup_files;
CREATE POLICY "Users can update own backup files" ON public.whatsapp_backup_files FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.backup_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_id UUID REFERENCES public.whatsapp_backups(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_audit_user ON public.backup_audit_log(user_id, created_at DESC);
ALTER TABLE public.backup_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.backup_audit_log;
CREATE POLICY "Users can view own audit logs" ON public.backup_audit_log FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.backup_audit_log;
CREATE POLICY "Users can insert audit logs" ON public.backup_audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_storage_used(p_user_id UUID, p_bytes BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $func$
BEGIN
  INSERT INTO public.storage_quotas (user_id, storage_used_bytes, storage_limit_bytes)
  VALUES (p_user_id, p_bytes, 5368709120)
  ON CONFLICT (user_id)
  DO UPDATE SET storage_used_bytes = public.storage_quotas.storage_used_bytes + p_bytes, updated_at = now();
END;
$func$;

CREATE OR REPLACE FUNCTION public.decrement_storage_used(p_user_id UUID, p_bytes BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $func$
BEGIN
  UPDATE public.storage_quotas
  SET storage_used_bytes = GREATEST(0, storage_used_bytes - p_bytes), updated_at = now()
  WHERE user_id = p_user_id;
END;
$func$;

CREATE OR REPLACE FUNCTION public.update_last_whatsapp_backup(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $func$
BEGIN
  UPDATE public.profiles SET last_whatsapp_backup = now() WHERE id = p_user_id;
END;
$func$;

CREATE OR REPLACE FUNCTION public.check_storage_available(p_user_id UUID, p_bytes BIGINT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $func$
DECLARE v_used BIGINT; v_limit BIGINT;
BEGIN
  SELECT storage_used_bytes, storage_limit_bytes INTO v_used, v_limit
  FROM public.storage_quotas WHERE user_id = p_user_id;
  IF v_limit IS NULL THEN RETURN p_bytes <= 5368709120; END IF;
  RETURN (COALESCE(v_used, 0) + p_bytes) <= v_limit;
END;
$func$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $func$
BEGIN
  INSERT INTO public.storage_quotas (user_id, storage_limit_bytes, storage_used_bytes)
  VALUES (NEW.id, 5368709120, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`;

  try {
    const response = await fetch(`${supabaseUrl}/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: fullMigration }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({
        error: `Échec: ${response.status}`,
        details: text,
        migration_sql: fullMigration,
        note: "Copiez ce SQL dans l'éditeur SQL Supabase → https://supabase.com/dashboard/project/uxwjvlbtmhvkgvfrdxdr/sql/new",
      }, { status: 500 });
    }

    return NextResponse.json({ message: "Migration appliquée avec succès!" });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      migration_sql: fullMigration,
      note: "Copiez ce SQL dans l'éditeur SQL Supabase → https://supabase.com/dashboard/project/uxwjvlbtmhvkgvfrdxdr/sql/new",
    }, { status: 500 });
  }
}

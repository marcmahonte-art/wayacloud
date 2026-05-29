import { createHash } from "crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { headObject, generatePresignedGet } from "@/lib/wasabi";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingFileId?: string;
  existingSize?: number;
}

export async function checkDuplicateMd5(md5: string, userId: string): Promise<DuplicateCheckResult> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("files")
    .select("id, size, source")
    .eq("md5", md5)
    .eq("user_id", userId)
    .neq("status", "deleted")
    .maybeSingle();
  if (data) {
    return { isDuplicate: true, existingFileId: data.id, existingSize: data.size };
  }
  return { isDuplicate: false };
}

export async function checkDuplicateByName(name: string, size: number, userId: string): Promise<DuplicateCheckResult> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("files")
    .select("id, size, source")
    .eq("name", name)
    .eq("size", size)
    .eq("user_id", userId)
    .neq("status", "deleted")
    .maybeSingle();
  if (data) {
    return { isDuplicate: true, existingFileId: data.id, existingSize: data.size };
  }
  return { isDuplicate: false };
}

export interface FileUploadMetadata {
  userId: string;
  name: string;
  size: number;
  mimeType: string;
  s3Key: string;
  md5: string;
  source: "whatsapp" | "manual";
  category: string;
}

export async function insertFileRecord(params: FileUploadMetadata): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("files")
    .insert({
      user_id: params.userId,
      name: params.name,
      size: params.size,
      mime_type: params.mimeType,
      s3_key: params.s3Key,
      md5: params.md5,
      source: params.source,
      category: params.category,
      status: "uploaded",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Erreur d'enregistrement du fichier: ${error.message}`);
  return data.id;
}

export async function verifyUpload(s3Key: string): Promise<boolean> {
  const meta = await headObject(s3Key);
  return meta !== null && meta.size > 0;
}

export async function confirmUpload(params: FileUploadMetadata): Promise<{ fileId: string; url: string }> {
  const exists = await verifyUpload(params.s3Key);
  if (!exists) {
    throw new Error("Le fichier n'a pas été trouvé sur le stockage. Veuillez réessayer l'upload.");
  }
  const fileId = await insertFileRecord(params);

  const { createAdminSupabaseClient: getAdmin } = await import("@/lib/supabase/admin");
  const admin = getAdmin();
  const { data: quota } = await admin
    .from("storage_quotas")
    .select("storage_used_bytes")
    .eq("user_id", params.userId)
    .maybeSingle();
  if (quota) {
    await admin
      .from("storage_quotas")
      .update({ storage_used_bytes: quota.storage_used_bytes + params.size })
      .eq("user_id", params.userId);
  }

  let url = "";
  try {
    url = await generatePresignedGet(params.s3Key);
  } catch {
    url = "";
  }

  return { fileId, url };
}

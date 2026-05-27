import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getWasabiClient, getWasabiBucket } from "@/lib/wasabi";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface FileRecord {
  id: string;
  owner_id: string;
  object_key: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  checksum_sha256: string | null;
}

export async function findExistingFile(
  ownerId: string,
  checksumSha256: string
): Promise<FileRecord | null> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("files")
    .select("id, owner_id, object_key, name, mime_type, size_bytes, checksum_sha256")
    .eq("owner_id", ownerId)
    .eq("checksum_sha256", checksumSha256)
    .neq("status", "deleted")
    .maybeSingle();
  return data;
}

export async function insertFileRecord(params: {
  ownerId: string;
  objectKey: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string | null;
}): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("files")
    .insert({
      owner_id: params.ownerId,
      bucket: getWasabiBucket(),
      object_key: params.objectKey,
      name: params.name,
      mime_type: params.mimeType,
      size_bytes: params.sizeBytes,
      checksum_sha256: params.checksumSha256,
      status: "uploaded",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Erreur d'enregistrement du fichier: ${error.message}`);
  return data.id;
}

export async function updateStorageUsed(
  ownerId: string,
  additionalBytes: number
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { data: quota } = await supabase
    .from("storage_quotas")
    .select("storage_used_bytes")
    .eq("user_id", ownerId)
    .maybeSingle();

  if (quota) {
    await supabase
      .from("storage_quotas")
      .update({ storage_used_bytes: quota.storage_used_bytes + additionalBytes })
      .eq("user_id", ownerId);
  }
}

export async function generatePublicUrl(objectKey: string): Promise<string> {
  const client = getWasabiClient();
  const command = new GetObjectCommand({
    Bucket: getWasabiBucket(),
    Key: objectKey,
  });
  return getSignedUrl(client, command, { expiresIn: 604800 });
}

export function buildObjectKey(
  ownerId: string,
  safeName: string,
  randomHex: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `uploads/${ownerId}/${year}/${month}/${day}/${randomHex}-${safeName}`;
}

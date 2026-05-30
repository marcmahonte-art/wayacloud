import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const PRESIGN_PUT_EXPIRY = 3600;
const PRESIGN_GET_EXPIRY = 900;

let cachedClient: S3Client | null = null;

export function getWasabiClient(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: process.env.WASABI_REGION ?? "eu-west-2",
    endpoint: process.env.WASABI_ENDPOINT,
    credentials: {
      accessKeyId: process.env.WASABI_ACCESS_KEY ?? "",
      secretAccessKey: process.env.WASABI_SECRET_KEY ?? "",
    },
    requestHandler: {
      requestTimeout: 30_000,
    },
  });
  return cachedClient;
}

export function getWasabiBucket(): string {
  return process.env.WASABI_BUCKET ?? "wayacloud-storage";
}

export async function generatePresignedPut(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getWasabiBucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getWasabiClient(), command, { expiresIn: PRESIGN_PUT_EXPIRY });
}

export async function generatePresignedGet(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getWasabiBucket(),
    Key: key,
  });
  return getSignedUrl(getWasabiClient(), command, { expiresIn: PRESIGN_GET_EXPIRY });
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getWasabiBucket(),
    Key: key,
  });
  await getWasabiClient().send(command);
}

export async function headObject(key: string): Promise<{ size: number; mimeType: string } | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: getWasabiBucket(),
      Key: key,
    });
    const result = await getWasabiClient().send(command);
    return {
      size: result.ContentLength ?? 0,
      mimeType: result.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export function buildWhatsAppKey(userId: string, fileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const id = nanoid(16);
  return `user-${userId}/whatsapp/${year}/${month}/${id}-${fileName}`;
}

export function buildUploadKey(userId: string, safeName: string, randomHex: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `uploads/${userId}/${year}/${month}/${day}/${randomHex}-${safeName}`;
}

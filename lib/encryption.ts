import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function deriveKey(userKey: string): Buffer {
  const hash = createHash("sha256").update(userKey).digest();
  return hash;
}

export function encryptFileAes256(data: Buffer, userKey: string): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(userKey);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptFileAes256(data: Buffer, userKey: string): Buffer {
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(userKey);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function generateUserEncryptionKey(userId: string, email: string): string {
  const pepper = process.env.ENCRYPTION_PEPPER ?? "wayacloud-default-pepper-do-not-use-in-prod";
  return createHash("sha256").update(`${userId}:${email}:${pepper}`).digest("hex");
}

export function encryptMetadata(plaintext: string, userKey: string): string {
  const data = Buffer.from(plaintext, "utf-8");
  const encrypted = encryptFileAes256(data, userKey);
  return encrypted.toString("hex");
}

export function decryptMetadata(cipherhex: string, userKey: string): string {
  const data = Buffer.from(cipherhex, "hex");
  const decrypted = decryptFileAes256(data, userKey);
  return decrypted.toString("utf-8");
}

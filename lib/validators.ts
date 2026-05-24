const dangerousFileNameCharacters = /[^a-zA-Z0-9._-]/g;
const blockedMimeTypes = new Set([
  "application/x-msdownload",
  "application/x-sh",
  "application/x-php",
  "text/x-python",
  "application/x-bat",
]);
const maxFileSizeBytes = 5 * 1024 * 1024 * 1024;

export function validatePhone(phone: string): boolean {
  return /^(\+226)?[0-9]{8}$/.test(phone.trim());
}

export function validateAmount(n: number): boolean {
  return Number.isInteger(n) && n >= 100 && n <= 50000;
}

export function sanitizeFileName(name: string): string {
  const withoutTraversal = name.replace(/\.\.+/g, "").replace(/[\\/]/g, "-");
  const sanitized = withoutTraversal.replace(dangerousFileNameCharacters, "-");
  return sanitized.replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "fichier";
}

export function validateFileType(mimeType: string): boolean {
  if (blockedMimeTypes.has(mimeType)) {
    return false;
  }

  return (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/") ||
    mimeType === "application/pdf" ||
    mimeType.startsWith("application/vnd.openxmlformats-officedocument.")
  );
}

export function validateFileSize(sizeBytes: number): boolean {
  return Number.isInteger(sizeBytes) && sizeBytes > 0 && sizeBytes <= maxFileSizeBytes;
}

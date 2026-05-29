const WHATSAPP_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp",
  "mp4", "mov",
  "mp3", "opus",
  "pdf", "docx", "xlsx", "pptx",
]);

const WHATSAPP_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp",
  "video/mp4", "video/quicktime",
  "audio/mpeg", "audio/opus", "audio/ogg",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const BLOCKED_EXTENSIONS = new Set(["exe", "bat", "sh", "php", "py", "cmd", "vbs", "msi", "jar", "dll"]);

const BLOCKED_MIME_TYPES = new Set([
  "application/x-msdownload",
  "application/x-sh",
  "application/x-php",
  "text/x-python",
  "application/x-bat",
  "application/x-msdos-program",
  "application/java-archive",
  "application/vnd.microsoft.portable-executable",
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateWhatsAppExtension(fileName: string): ValidationResult {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { valid: false, error: "Type de fichier non autorisé pour la sauvegarde WhatsApp." };
  }
  if (!WHATSAPP_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Extension .${ext} non prise en charge pour la sauvegarde WhatsApp.` };
  }
  return { valid: true };
}

export function validateWhatsAppMimeType(mimeType: string): ValidationResult {
  if (BLOCKED_MIME_TYPES.has(mimeType)) {
    return { valid: false, error: "Type MIME non autorisé." };
  }
  if (!WHATSAPP_MIME_TYPES.has(mimeType) && !mimeType.startsWith("image/") && !mimeType.startsWith("video/") && !mimeType.startsWith("audio/")) {
    return { valid: false, error: `Type MIME ${mimeType} non pris en charge.` };
  }
  return { valid: true };
}

export function sanitizeFileName(name: string): string {
  const withoutTraversal = name.replace(/\.\.+/g, "").replace(/[\\/]/g, "-");
  const sanitized = withoutTraversal.replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized.replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "fichier";
}

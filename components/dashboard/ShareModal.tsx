"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X, Link, Copy, Check, Users, Globe, Clock,
  Mail, Loader2, Lock, Shield,
} from "lucide-react";
import { FileItem } from "./FileContextMenu";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}

export function ShareModal({ isOpen, onClose, file }: ShareModalProps) {
  const [shareLink, setShareLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiration, setExpiration] = useState("24h");
  const [permission, setPermission] = useState<"view" | "download" | "edit">("view");
  const [emailInput, setEmailInput] = useState("");
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);
  const [isEmailSending, setIsEmailSending] = useState(false);

  const generateLink = useCallback(async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          expiration,
          permission,
        }),
      });
      const data = await res.json();
      setShareLink(data.url || `https://wayacloud.silk.vercel.app/s/${data.token || ""}`);
    } catch {
      setShareLink(`https://wayacloud.silk.vercel.app/s/error`);
    } finally {
      setIsGenerating(false);
    }
  }, [file, expiration, permission]);

  useEffect(() => {
    if (isOpen && file) {
      generateLink();
      setCopied(false);
      setSharedEmails([]);
      setEmailInput("");
    }
  }, [isOpen, file, generateLink]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !sharedEmails.includes(email)) {
      setSharedEmails([...sharedEmails, email]);
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    setSharedEmails(sharedEmails.filter((e) => e !== email));
  };

  const sendInvites = async () => {
    if (sharedEmails.length === 0) return;
    setIsEmailSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsEmailSending(false);
    setSharedEmails([]);
    setEmailInput("");
  };

  if (!isOpen || !file) return null;

  const expirationOptions = [
    { value: "1h", label: "1 heure" },
    { value: "24h", label: "24 heures" },
    { value: "7d", label: "7 jours" },
    { value: "30d", label: "30 jours" },
    { value: "never", label: "Jamais" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95">
        <div className="overflow-hidden rounded-2xl border border-[#EAE5E0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Share2Icon />
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-dark">Partager</h2>
                <p className="text-[12px] text-[#9CA3AF] font-medium truncate max-w-[300px]">{file.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#F5F3F0] hover:text-dark transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-[#4A4A4A] mb-2">
                <Link size={15} /> Lien de partage
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2.5 rounded-lg border border-[#EAE5E0] bg-[#FAF9F7] px-3.5 py-2.5">
                  {isGenerating ? (
                    <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                  ) : (
                    <Link size={16} className="text-primary shrink-0" />
                  )}
                  <span className="text-[13px] text-[#4A4A4A] font-medium truncate">
                    {isGenerating ? "Génération..." : shareLink}
                  </span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-light transition-colors"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              {copied && (
                <p className="mt-1.5 text-[12px] text-green-600 font-medium flex items-center gap-1">
                  <Check size={13} /> Lien copié dans le presse-papiers
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[13px] font-semibold text-[#4A4A4A] mb-2">
                  <Clock size={15} /> Expiration
                </label>
                <select
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3 py-2.5 text-[13px] font-medium text-[#4A4A4A] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                >
                  {expirationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[13px] font-semibold text-[#4A4A4A] mb-2">
                  <Shield size={15} /> Permission
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as any)}
                  className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3 py-2.5 text-[13px] font-medium text-[#4A4A4A] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                >
                  <option value="view">Lecture seule</option>
                  <option value="download">Lecture + Téléchargement</option>
                  <option value="edit">Modification</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[#F0ECE6] pt-5">
              <label className="flex items-center gap-2 text-[13px] font-semibold text-[#4A4A4A] mb-2">
                <Mail size={15} /> Partager par email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEmail()}
                  placeholder="email@exemple.com"
                  className="flex-1 rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[#B0B0B0] focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                />
                <button
                  onClick={addEmail}
                  disabled={!emailInput.trim()}
                  className="h-[42px] shrink-0 rounded-lg bg-[#F5F3F0] px-4 text-[13px] font-semibold text-[#4A4A4A] hover:bg-[#EAE5E0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
              {sharedEmails.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sharedEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F3F0] px-3 py-1.5 text-[12px] font-medium text-[#4A4A4A]"
                    >
                      <Users size={13} />
                      {email}
                      <button
                        onClick={() => removeEmail(email)}
                        className="ml-0.5 text-[#9CA3AF] hover:text-red-500 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {sharedEmails.length > 0 && (
                <button
                  onClick={sendInvites}
                  disabled={isEmailSending}
                  className="mt-3 w-full rounded-lg bg-primary py-2.5 text-[13px] font-bold text-white hover:bg-primary-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isEmailSending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Mail size={15} />
                  )}
                  {isEmailSending ? "Envoi..." : `Envoyer à ${sharedEmails.length} personne${sharedEmails.length > 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-[#F0ECE6] bg-[#FAF9F7] px-6 py-3">
            <Lock size={13} className="text-green-600" />
            <span className="text-[12px] text-[#9CA3AF] font-medium">
              Partagé de manière sécurisée via un lien chiffré
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Share2Icon() {
  const [Share2, setShare2] = useState<any>(null);
  useEffect(() => {
    import("lucide-react").then(mod => setShare2(() => mod.Share2));
  }, []);
  if (!Share2) return <span className="h-5 w-5" />;
  return <Share2 size={20} />;
}

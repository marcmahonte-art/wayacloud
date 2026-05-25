import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "WayaCloud - Cloud IA Souverain pour l'Afrique",
  description:
    "AI-Powered Cloud Storage for Africa. Secure. Intelligent. Limitless. Plateforme cloud souveraine pour sauvegarder, organiser et partager les fichiers.",
  keywords: ["cloud", "Afrique", "IA", "stockage", "souverain", "Burkina Faso"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${jost.variable} bg-background font-jost text-dark antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

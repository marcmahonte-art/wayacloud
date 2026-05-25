import type { Metadata } from "next";
import "./globals.css";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background font-jost text-dark antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

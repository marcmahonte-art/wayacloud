import type { Metadata } from "next";
import { Jost, Readex_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

const readexPro = Readex_Pro({
  subsets: ["latin"],
  variable: "--font-readex",
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
      <head>
        <link rel="preload" href="/logo-light.svg" as="image" />
        <link rel="preload" href="/logo-dark.svg" as="image" />
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","x2dcnmt9g6");`,
          }}
        />
      </head>
      <body className={`${jost.variable} ${readexPro.variable} bg-background font-jost text-dark antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WayaCloud",
  description:
    "AI-Powered Cloud Storage for Africa. Secure. Intelligent. Limitless.",
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
          href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background font-jost text-dark antialiased">
        {children}
      </body>
    </html>
  );
}

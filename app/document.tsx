// app/document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom Document for the Waya Cloud application.
 * This file replaces the legacy `pages/_document.js` that existed in older
 * Next.js versions. It is required when you need to customise the initial
 * HTML document (e.g., add meta tags, link fonts, set language, etc.).
 */
export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        {/* Example: Google Fonts – you can replace with your preferred fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* You can add other global meta tags here */}
      </Head>
      <body className="bg-gray-50 font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

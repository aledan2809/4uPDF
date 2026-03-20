import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/auth";
import CookieConsent from "./components/CookieConsent";
import Script from "next/script";

const BASE_URL = "https://4updf.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "4uPDF - Free Online PDF Tools | Fast, Secure, No Registration",
    template: "%s | 4uPDF",
  },
  description:
    "Free online PDF tools for everyone. Merge, split, compress, convert, edit PDFs and more. Fast, secure, and no registration required. 40+ tools available.",
  keywords: [
    "PDF tools",
    "free PDF",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "PDF to Word",
    "PDF converter",
    "online PDF editor",
    "OCR PDF",
    "PDF tools online",
  ],
  authors: [{ name: "4uPDF" }],
  creator: "4uPDF",
  publisher: "4uPDF",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "4uPDF",
    title: "4uPDF - Free Online PDF Tools",
    description:
      "Free online PDF tools for everyone. Merge, split, compress, convert, edit PDFs and more. Fast, secure, and no registration required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "4uPDF - Free Online PDF Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "4uPDF - Free Online PDF Tools",
    description:
      "Free online PDF tools. Merge, split, compress, convert PDFs and more. Fast, secure, no registration.",
    images: ["/og-image.png"],
    creator: "@4updf",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              'analytics_storage': 'denied'
            });
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
      </body>
    </html>
  );
}

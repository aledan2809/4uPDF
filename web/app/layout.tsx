import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/auth";
import CookieConsent from "./components/CookieConsent";
import ReturningVisitorPrompt from "./components/ReturningVisitorPrompt";
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
        <AuthProvider>
          {children}
          <ReturningVisitorPrompt />
        </AuthProvider>
        <CookieConsent />
        <Script id="heartbeat" strategy="afterInteractive">
          {`
            (function(){
              var API = "${process.env.NEXT_PUBLIC_API_URL || ""}";
              if(!API) return;
              var sid = Math.random().toString(36).slice(2,10);
              function beat(){
                var page = window.location.pathname;
                var tool = null;
                if(page.startsWith("/tools/")) tool = page.split("/")[2] || null;
                fetch(API+"/api/heartbeat",{
                  method:"POST",
                  headers:{"Content-Type":"application/json"},
                  credentials:"include",
                  body:JSON.stringify({current_page:page,tool_name:tool,session_id:sid})
                }).catch(function(){});
              }
              beat();
              setInterval(beat, 30000);
            })();
          `}
        </Script>

        <Script id="pageview-tracker" strategy="afterInteractive">
          {`
            (function(){
              var API = "${process.env.NEXT_PUBLIC_API_URL || ""}";
              if(!API) return;
              // Analytics consent gate (GDPR / AdSense pre-req): only track once
              // the visitor has accepted analytics cookies — same flag GA Consent
              // Mode and ReturningVisitorPrompt use. No accept → no pageview, no
              // first-touch storage.
              function analyticsOk(){
                try{ return JSON.parse(localStorage.getItem('cookieConsent')||'{}').analytics === true; }catch(e){ return false; }
              }
              function getUtm(){
                try{
                  var p = new URLSearchParams(window.location.search);
                  return {
                    utm_source: p.get('utm_source')||'',
                    utm_medium: p.get('utm_medium')||'',
                    utm_campaign: p.get('utm_campaign')||'',
                    utm_content: p.get('utm_content')||'',
                    utm_term: p.get('utm_term')||'',
                    fbclid: p.get('fbclid')||''
                  };
                }catch(e){ return {utm_source:'',utm_medium:'',utm_campaign:'',utm_content:'',utm_term:'',fbclid:''}; }
              }
              // First-touch attribution: persist the very first landing source
              try{
                var u0 = getUtm();
                if(analyticsOk() && (u0.utm_source || u0.utm_campaign || u0.fbclid) && !localStorage.getItem('_4u_acq')){
                  localStorage.setItem('_4u_acq', JSON.stringify({
                    source: u0.utm_source || (u0.fbclid ? 'facebook' : ''),
                    campaign: u0.utm_campaign || '',
                    referrer: document.referrer || '',
                    ts: Date.now()
                  }));
                }
              }catch(e){}
              var tracked = {};
              function trackPageView(){
                if(!analyticsOk()) return;
                var page = window.location.pathname;
                var ref = document.referrer || '';
                var key = page + '|' + Date.now().toString().slice(0,-4);
                if(tracked[key]) return;
                tracked[key] = true;
                var u = getUtm();
                var hdrs = {"Content-Type":"application/json"};
                try { var tk = localStorage.getItem('auth_token'); if(tk){ hdrs['Authorization'] = 'Bearer ' + tk; } } catch(e){}
                fetch(API+"/api/analytics/track",{
                  method:"POST",
                  headers:hdrs,
                  credentials:"include",
                  body:JSON.stringify({event_type:"pageview",page:page,referrer:ref,
                    utm_source:u.utm_source,utm_medium:u.utm_medium,utm_campaign:u.utm_campaign,
                    utm_content:u.utm_content,utm_term:u.utm_term,fbclid:u.fbclid})
                }).catch(function(){});
              }
              trackPageView();
              // Track SPA navigation via History API
              var origPush = history.pushState;
              history.pushState = function(){
                origPush.apply(this, arguments);
                setTimeout(trackPageView, 100);
              };
              window.addEventListener('popstate', function(){ setTimeout(trackPageView, 100); });
              // When the visitor accepts analytics cookies, capture the current
              // landing pageview that was skipped before consent.
              window.addEventListener('4u:consent', trackPageView);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}

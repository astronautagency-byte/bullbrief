import type { Metadata, Viewport } from "next";
import { Anybody, Geist, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://bullbrief.vercel.app";
const OG_IMAGE = `${SITE_URL}/BullBrief_App_Icon.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BullBrief — Your Daily Market Brief is Here",
    template: "%s | BullBrief",
  },
  description:
    "Follow the stocks that matter to you and get daily market updates, relevant headlines and podcast episodes in one focused briefing. Built for financial advisors.",
  keywords: [
    "market briefing",
    "stock market",
    "financial news",
    "investment portfolio",
    "daily market update",
    "financial advisor",
    "stock watchlist",
    "market summary",
    "earnings",
    "podcasts",
    "finance app",
  ],
  authors: [{ name: "BullBrief" }],
  creator: "BullBrief",
  publisher: "BullBrief",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "BullBrief",
    title: "BullBrief — Your Daily Market Brief is Here",
    description:
      "Follow the stocks that matter to you and get daily market updates, relevant headlines and podcast episodes in one focused briefing.",
    images: [
      {
        url: OG_IMAGE,
        width: 512,
        height: 512,
        alt: "BullBrief — Daily Market Briefing",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BullBrief — Your Daily Market Brief is Here",
    description:
      "Follow the stocks that matter to you and get daily market updates, relevant headlines and podcast episodes in one focused briefing.",
    images: [OG_IMAGE],
    creator: "@bullbrief",
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
  icons: {
    icon: "/BullBrief_App_Icon.png",
    apple: "/BullBrief_App_Icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BullBrief",
  },
  verification: {},
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#051424",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${anybody.variable} ${geist.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BullBrief" />
        <link rel="apple-touch-icon" href="/BullBrief_App_Icon.png" />
        <meta name="application-name" content="BullBrief" />
        <meta name="theme-color" content="#051424" />
      </head>
      <body className="min-h-full bg-background text-foreground font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "BullBrief",
              url: "https://bullbrief.vercel.app",
              description:
                "Follow the stocks that matter to you and get daily market updates, relevant headlines and podcast episodes in one focused briefing.",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "BullBrief",
                url: "https://bullbrief.vercel.app",
              },
            }),
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

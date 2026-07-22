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

export const metadata: Metadata = {
  title: "BullBrief — Your Daily Market Brief is Here",
  description:
    "Follow the stocks that matter to you and get daily market updates, relevant headlines and podcast episodes in one focused briefing.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BullBrief",
  },
  icons: {
    icon: "/BullBrief_App_Icon.png",
    apple: "/BullBrief_App_Icon.png",
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
      </head>
      <body className="min-h-full bg-background text-foreground font-body">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

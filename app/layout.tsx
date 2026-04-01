import type { Metadata } from "next";
import type { Viewport } from "next";
import { IBM_Plex_Sans_KR, Space_Grotesk } from "next/font/google";

import { WorkoutAppProvider } from "@/components/providers/workout-app-provider";
import { PwaBootstrap } from "@/components/pwa-bootstrap";

import "./globals.css";

const bodyFont = IBM_Plex_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fillout-mvp.vercel.app"),
  title: "Fillout",
  description: "캘린더 중심의 커스텀 운동 기록 웹앱 MVP",
  manifest: "/manifest.webmanifest",
  applicationName: "Fillout",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fillout",
  },
  icons: {
    icon: "/app-icon.svg",
    apple: "/app-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#10253f",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WorkoutAppProvider>
          <PwaBootstrap />
          {children}
        </WorkoutAppProvider>
      </body>
    </html>
  );
}

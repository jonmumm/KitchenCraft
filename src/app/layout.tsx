import { Toaster } from "@/components/feedback/toaster";
import { GoogleAdSense } from "@/components/google-adsense";
import { ThemeProvider } from "@/components/theme-provider";
import { getSession } from "@/lib/auth/session";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import "../styles/globals.css";
import { ApplicationProvider } from "./provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KitchenCraft",
  description: "Make something different",
};

export default async function RootLayout({
  children,
  craft,
  remix,
}: {
  children: ReactNode;
  craft: ReactNode;
  remix: ReactNode;
}) {
  const Body = () => {
    return (
      <body
        className={`${inter.className} overflow-x-hidden pb-16`}
        // className={`bg-gray-100 ${inter.className} flex flex-col mx-auto max-w-lg xl:max-w-xl justify-center`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {craft}
          {remix}
        </ThemeProvider>
        <Toaster />
      </body>
    );
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
          href="/apple-launch-1125x2436.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
          href="/apple-launch-750x1334.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
          href="/apple-launch-1242x2208.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
          href="/apple-launch-640x1136.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
          href="/apple-launch-1536x2048.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
          href="/apple-launch-1668x2224.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
          href="/apple-launch-1179x2556.png"
        ></link>
        {/* iPhone 15 Pro and iPhone 15 */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
          href="/apple-launch-2048x2732.png"
        />
        {/* iPhone 14 and iPhone 14 Pro */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
          href="/apple-launch-1170x2532.png"
        ></link>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <GoogleAdSense />
      </head>
      <ApplicationProvider session={await getSession()}>
        <Body />
      </ApplicationProvider>
    </html>
  );
}

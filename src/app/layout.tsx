import { ThemeProvider } from "@/components/theme-provider";
import { noop } from "@/lib/utils";
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
  gallery,
}: {
  children: ReactNode;
  craft: ReactNode;
  gallery: ReactNode;
}) {
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
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </head>
      <ApplicationProvider>
        <Body>
          {children}
          {craft}
          {gallery}
        </Body>
      </ApplicationProvider>
    </html>
  );
}

function Body({ children }: { children: ReactNode }) {
  // const cookies = getCookies();
  // let themeValue = cookies.get("theme");
  // if (!themeValue) {
  //   themeValue = "system";
  //   cookies.set("theme", themeValue);
  // }
  // console.log({ cookies });

  // async function

  return (
    <body
      className={`${inter.className}`}
      // className={`bg-gray-100 ${inter.className} flex flex-col mx-auto max-w-lg xl:max-w-xl justify-center`}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
      {/* <Main>{children}</Main>; */}
    </body>
  );
}

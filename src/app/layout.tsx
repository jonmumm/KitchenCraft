import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import "../styles/globals.css";
import { ApplicationProvider } from "./provider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KitchenCraft",
  description: "Make something different",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // const data = await serverClient.getData();
  // const dataSet = await serverClient.setData("test-data");
  // console.log({ data, dataSet });

  return (
    <ApplicationProvider input={{ userId: undefined, sessionId: "" }}>
      {/* suppress per: https://github.com/vercel/next.js/issues/49350 */}
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
        <Body>{children}</Body>
      </html>
    </ApplicationProvider>
  );
}

function Body({ children }: { children: ReactNode }) {
  return (
    <body
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

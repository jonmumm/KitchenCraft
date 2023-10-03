import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import "../styles/globals.css";
import { Header } from "./header";
import { ApplicationProvider } from "./provider";

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
    <html lang="en" className="max-h-full h-full">
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
      </head>

      <body
        className={`bg-gray-100 ${inter.className} max-h-full h-full flex flex-col`}
      >
        <ApplicationProvider input={{ userId: undefined, sessionId: "" }}>
          <Layout>{children}</Layout>
        </ApplicationProvider>
      </body>
    </html>
  );
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex w-full flex-1 max-h-full overflow-hidden">
        {children}
      </main>
    </>
  );
}

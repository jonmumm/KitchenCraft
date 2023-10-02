import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { Header } from "./header";
import { ApplicationProvider } from "./provider";
import { Separator } from "@/components/ui/separator";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KitchenCraft",
  description: "Make something different",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="max-h-full h-full">
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
  // Todo swap between pt-16 and pt-0 here depending on header is taking up space3
  return (
    <>
      <Header />
      <main className="flex w-full flex-1 max-h-full overflow-hidden">
        {children}
      </main>
    </>
  );
}

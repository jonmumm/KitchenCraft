import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { Header } from "./header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KitchenCraft",
  description: "Make something different",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`bg-gray-100 ${inter.className}`}>
        <Header />

        <main className="container mx-auto p-4 mt-6">{children}</main>

        {/* <footer className="bg-white p-4 mt-12 border-t">
          <div className="container mx-auto text-center text-sm text-gray-600">
            &copy; 2023 KitchenCraft. All rights reserved.
          </div>
        </footer> */}
      </body>
    </html>
  );
}

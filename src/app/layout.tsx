import { GoogleAdSense } from "@/components/google-adsense";
import { ThemeProvider } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/server";
import { assert } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import "../styles/globals.css";
import { ApplicationProvider, UserProvider } from "./provider";
import { env } from "@/env.public";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KitchenCraft",
  description: "Make something different",
};

export default async function RootLayout({
  children,
  craft,
}: {
  children: ReactNode;
  craft: ReactNode;
}) {
  const Body = () => {
    return (
      <body
        className={`${inter.className} overflow-x-hidden`}
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
        </ThemeProvider>
      </body>
    );
  };

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // const headerList = headers();
  // const host = headerList.get("host");
  // assert(host, "expected host");
  // const protocol =
  //   host.match("localhost") || host.match("127.0.0.1") ? "http" : "https";
  // const origin = `${protocol}://${host}`;
  // console.log({ origin });

  async function signIn() {
    "use server";
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const redirectTo = `${env.KITCHENCRAFT_URL}/auth/callback`;

    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    console.log({ result, redirectTo });

    if (result.data.url) {
      redirect(result.data.url);
    } else {
      redirect(
        `/error?message=${encodeURIComponent(
          "Error trying to login to Google"
        )}`
      );
    }
  }

  async function signOut() {
    "use server";
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    await supabase.auth.signOut();
    redirect("/");
  }

  // signOut  async () => {
  //   "use server";
  // };

  // if (!user) {
  //   throw new Error("")
  //   user = supabase.auth.
  // }

  // const origin = headerList.get("origin");
  // assert(origin, "expected origin in headers");

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
        <GoogleAdSense />
      </head>
      <ApplicationProvider>
        <UserProvider user={user} signOut={signOut} signIn={signIn}>
          <Body />
        </UserProvider>
      </ApplicationProvider>
    </html>
  );
}

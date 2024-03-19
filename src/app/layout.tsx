import { Toaster as LegacyToaster } from "@/components/feedback/toaster";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogOverlay,
} from "@/components/layout/responsive-dialog";
import { IOSStartupImages } from "@/components/meta/ios-startup-images";
import { ThemeProvider } from "@/components/theme-provider";
import { ActorProvider } from "@/lib/actor-kit/components.client";
import {
  getCurrentEmail,
  getSession,
  getSessionActorClient,
  getUniqueId,
} from "@/lib/auth/session";
import { createAppInstallToken } from "@/lib/browser-session";
import { parseCookie } from "@/lib/coookieStore";
import { getCanInstallPWA, getIsMobile } from "@/lib/headers";
import { assert, noop } from "@/lib/utils";
import { SafariInstallPrompt } from "@/modules/pwa-install/safari-install-prompt";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "../styles/globals.css";
import {
  Body,
  IsInputtingEmail,
  SaveRecipeCard,
  SearchParamsToastMessage,
} from "./components.client";
import { ApplicationProvider } from "./provider";
import { SessionStoreProvider } from "./session-store-provider";
import "./styles.css";

const APP_NAME = "KitchenCraft";
const APP_DEFAULT_TITLE = "kitchencraft.ai";
const APP_TITLE_TEMPLATE = "%s | KitchenCraft";
const APP_DESCRIPTION = "Create unique recipes, instantly.";

export const metadata: Metadata = {
  title: "KitchenCraft",
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
  craft,
  footer,
  header,
  remix,
  banner,
}: {
  children: ReactNode;
  craft: ReactNode;
  footer: ReactNode;
  header: ReactNode;
  remix: ReactNode;
  banner: ReactNode;
}) {
  const uniqueId = await getUniqueId();
  const currentEmail = await getCurrentEmail();
  const appInstallToken = await createAppInstallToken(uniqueId, currentEmail);

  let manifestHref = `/user-app-manifest.json`;
  if (appInstallToken) {
    manifestHref += `?token=${appInstallToken}`;
  }

  const canInstallPWA = getCanInstallPWA();
  const session = await getSession();

  const sessionActorClient = await getSessionActorClient();
  // todo: generate a session id instead of using the users unique id for the session id
  const { snapshot, connectionId, token } =
    await sessionActorClient.get(uniqueId);
  assert(snapshot, "expected snapshot");
  sessionActorClient.send(uniqueId, { type: "SSR_LAYOUT" }).then(noop);

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
        <link rel="manifest" href={manifestHref} />
        <IOSStartupImages />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* // todo only do this if react node loaded */}
      </head>
      {/* // TODO allow server-actor to send events before rendering... */}
      {/* Enables server to centralize logic in a machine across routes */}
      <SessionStoreProvider initial={snapshot}>
        <ApplicationProvider
          session={session}
          appSessionId={parseCookie("appSessionId")}
        >
          <ActorProvider
            id={uniqueId}
            connectionId={connectionId}
            token={token}
          >
            <Body isPWA={!!parseCookie("appSessionId")}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <div className="min-h-screen flex flex-col">
                  <div>{banner}</div>
                  <div>{header}</div>
                  <div className="crafting:hidden">{children}</div>
                  <div className="flex-1 hidden crafting:flex flex-col">
                    {craft}
                  </div>
                </div>
                <div className="sticky bottom-0 z-20">{footer}</div>
                {canInstallPWA && <SafariInstallPrompt />}
                <RegistrationDialog />
              </ThemeProvider>
              <Toaster />
              <SearchParamsToastMessage />
              <LegacyToaster />
            </Body>
          </ActorProvider>
        </ApplicationProvider>
      </SessionStoreProvider>
    </html>
  );
}

const RegistrationDialog = () => {
  const isMobile = getIsMobile();
  return (
    <IsInputtingEmail>
      <ResponsiveDialog open isMobile={isMobile}>
        <ResponsiveDialogOverlay />
        <ResponsiveDialogContent>
          <SaveRecipeCard />
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </IsInputtingEmail>
  );
};

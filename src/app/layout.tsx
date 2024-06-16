import { Toaster as LegacyToaster } from "@/components/feedback/toaster";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogOverlay,
} from "@/components/layout/responsive-dialog";
import { IOSStartupImages } from "@/components/meta/ios-startup-images";
import { ThemeProvider } from "@/components/theme-provider";
import { AppMatches } from "@/components/util/app-matches";
import { PageSessionMatches } from "@/components/util/page-session-matches";
import { SessionSnapshotMatches } from "@/components/util/session-matches";
import { ActorProvider } from "@/lib/actor-kit/components.client";
import {
  getCurrentEmail,
  getNextAuthSession,
  getPageSessionActorClient,
  getUniqueId,
} from "@/lib/auth/session";
import { parseCookie } from "@/lib/coookieStore";
import { getCanInstallPWA, getIsMobile } from "@/lib/headers";
import {
  createAccessToken,
  createAppInstallToken,
  getPageSessionId,
  getRequestUrl,
  getSessionId,
  getUserId,
} from "@/lib/session";
import { assert } from "@/lib/utils";
import { SafariInstallPrompt } from "@/modules/pwa-install/safari-install-prompt";
import { IS_SELECTING_LIST } from "@/states/app.states";
import type { Metadata } from "next";
import Script from "next/script";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "../styles/globals.css";
import {
  Body,
  CraftStickyHeader,
  CreateNewListCard,
  EnterChefNameCard,
  EnterEmailCard,
  IsInMyCookbook,
  IsInPersonalizationSettings,
  IsInputtingChefName,
  IsInputtingEmail,
  IsUpgradingAccount,
  MyRecipesScreen,
  PersonalizationSettingsMenu,
  SearchParamsToastMessage,
  SelectListCard,
  UpgradeAccountCard,
} from "./components.client";
import EmailCodeCard from "./email-code-card";
import { PageSessionStoreProvider } from "./page-session-store-provider";
import { ApplicationProvider } from "./provider";
import { ShareDetailsCard } from "./share-details-card";
import { SignInCard } from "./sign-in-card";
import "./styles.css";

export const revalidate = 0;

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

export default async function RootLayout(
  {
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
  },
  params: Record<string, string>
) {
  const uniqueId = await getUniqueId();
  const currentEmail = await getCurrentEmail();
  const appInstallToken = await createAppInstallToken(uniqueId, currentEmail);

  let manifestHref = `/user-app-manifest.json`;
  if (appInstallToken) {
    manifestHref += `?token=${appInstallToken}`;
  }

  const canInstallPWA = getCanInstallPWA();
  const nextAuthSession = await getNextAuthSession();

  const pageSessionActorClient = await getPageSessionActorClient();
  const pageSessionId = await getPageSessionId();
  const sessionId = getSessionId();
  const userId = getUserId();
  const userAccessToken = await createAccessToken({
    actorId: userId,
    type: "user",
    callerId: userId,
    callerType: "user",
  });
  const sessionAccessToken = await createAccessToken({
    actorId: sessionId,
    type: "session",
    callerId: getUserId(),
    callerType: "user",
  });
  const url = await getRequestUrl();
  const { snapshot, connectionId, token } = await pageSessionActorClient.get(
    pageSessionId,
    { url, sessionAccessToken, userAccessToken }
  );
  assert(snapshot, "expected snapshot");

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
      <PageSessionStoreProvider initial={snapshot}>
        <ApplicationProvider
          nextAuthSession={nextAuthSession}
          appSessionId={parseCookie("appSessionId")}
          token={token}
        >
          <ActorProvider
            id={pageSessionId}
            connectionId={connectionId}
            token={token}
            // reauthenticate={reauthenticate.bind(null, pageSessionId)}
          >
            <Body isPWA={!!parseCookie("appSessionId")}>
              {/* next-themes uses the color-scheme CSS property to differentiate light and dark themes,
                but Tailwind is watching for a CSS class. */}
              <Script id="theme-detector">{`
                const theme = document.documentElement.style.colorScheme
                document.documentElement.classList.add(theme)
              `}</Script>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <div className="min-h-screen flex flex-col">
                  <div>{banner}</div>
                  <CraftStickyHeader>{header}</CraftStickyHeader>
                  <div className="crafting:hidden">{children}</div>
                  <div className="flex-1 hidden crafting:flex flex-col">
                    {craft}
                  </div>
                </div>
                <div className="sticky bottom-0 z-20">{footer}</div>
                {canInstallPWA && <SafariInstallPrompt />}
                <RegistrationDialog />
                <SaveDialog />
                <ShareDialog />
                <SignInDialog />
                <PersonalizationSettingsDialog />
                <UpgradeAccountDialog />
                <MyRecipes />
              </ThemeProvider>
              <Toaster className="z-100" />
              <SearchParamsToastMessage />
              <LegacyToaster />
            </Body>
          </ActorProvider>
        </ApplicationProvider>
      </PageSessionStoreProvider>
    </html>
  );
}

// const OnboardingDialog = () => {
//   const isMobile = getIsMobile();

//   return (
//     <>
//       <IsInOnboarding>
//         <ResponsiveDialog open isMobile={isMobile}>
//           <ResponsiveDialogOverlay />
//           <ResponsiveDialogContent className="max-h-[85vh] overflow-y-auto">
//             <OnboardingFlow />
//           </ResponsiveDialogContent>
//         </ResponsiveDialog>
//       </IsInOnboarding>
//     </>
//   );
// };
const SignInDialog = () => {
  const isMobile = getIsMobile();

  return (
    <>
      <SessionSnapshotMatches
        matchedState={{ Auth: { SigningIn: "Inputting" } }}
      >
        <ResponsiveDialog open isMobile={isMobile}>
          <ResponsiveDialogOverlay />
          <ResponsiveDialogContent className="max-h-[85vh] overflow-y-auto rounded-t-xl">
            <SignInCard />
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </SessionSnapshotMatches>
      <SessionSnapshotMatches
        matchedState={{ Auth: { SigningIn: "WaitingForCode" } }}
        initialValueOverride={false}
      >
        <ResponsiveDialog open isMobile={isMobile}>
          <ResponsiveDialogOverlay />
          <ResponsiveDialogContent className="max-h-[85vh] overflow-y-auto rounded-t-xl">
            <EmailCodeCard />
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </SessionSnapshotMatches>
    </>
  );
};

const ShareDialog = () => {
  const isMobile = getIsMobile();

  return (
    <AppMatches matchedState={{ Share: { Open: "True" } }}>
      <ResponsiveDialog open isMobile={isMobile}>
        <ResponsiveDialogOverlay event={{ type: "CANCEL" }} className="z-80" />
        <ResponsiveDialogContent className="max-h-[85vh] overflow-y-auto rounded-t-xl z-90">
          <ShareDetailsCard />
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </AppMatches>
  );
};

const PersonalizationSettingsDialog = () => {
  const isMobile = getIsMobile();

  return (
    <>
      <IsInPersonalizationSettings>
        <ResponsiveDialog open isMobile={isMobile}>
          <ResponsiveDialogOverlay />
          <ResponsiveDialogContent className="max-h-[85vh] overflow-y-auto rounded-t-xl">
            <PersonalizationSettingsMenu />
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </IsInPersonalizationSettings>
    </>
  );
};

const MyRecipes = () => {
  return (
    <IsInMyCookbook>
      <MyRecipesScreen />
    </IsInMyCookbook>
  );
};

const UpgradeAccountDialog = () => {
  const isMobile = getIsMobile();
  return (
    <>
      <IsUpgradingAccount>
        <ResponsiveDialog open isMobile={isMobile}>
          <ResponsiveDialogOverlay />
          <ResponsiveDialogContent>
            <UpgradeAccountCard />
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </IsUpgradingAccount>
    </>
  );
};

const RegistrationDialog = () => {
  const isMobile = getIsMobile();
  return (
    <>
      <IsInputtingEmail>
        <ResponsiveDialog open isMobile={isMobile}>
          <ResponsiveDialogOverlay />
          <ResponsiveDialogContent>
            <EnterEmailCard />
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </IsInputtingEmail>
      <IsInputtingChefName>
        <ResponsiveDialog open isMobile={isMobile}>
          <ResponsiveDialogOverlay />
          <ResponsiveDialogContent>
            <EnterChefNameCard />
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </IsInputtingChefName>
    </>
  );
};

const SaveDialog = () => {
  const isMobile = getIsMobile();
  return (
    <>
      <AppMatches matchedState={IS_SELECTING_LIST}>
        <ResponsiveDialog open isMobile={isMobile}>
          <ResponsiveDialogOverlay />
          <ResponsiveDialogContent>
            <SelectListCard />
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </AppMatches>
      <PageSessionMatches
        matchedState={{ ListCreating: "True" }}
        or={{ ListCreating: "Error" }}
      >
        <ResponsiveDialog open isMobile={isMobile}>
          <ResponsiveDialogOverlay />
          <ResponsiveDialogContent>
            <CreateNewListCard />
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </PageSessionMatches>
    </>
  );
};

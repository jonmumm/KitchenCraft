import { Button } from "@/components/input/button";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { TypeLogo } from "@/components/logo";
import { MainMenu } from "@/components/modules/main-menu";
import { SafariInstallPrompt } from "@/components/modules/pwa-install/safari-install-prompt";
import { db } from "@/db";
import {
  getActiveSubscriptionForUserId,
  getProfileByUserId,
} from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import Bowser from "bowser";
import { AxeIcon, GripVerticalIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Observable, from, map, of, shareReplay } from "rxjs";

export async function Header({ className }: { className?: string }) {
  const session = await getSession();
  const headerList = headers();
  const browser = Bowser.getParser(headerList.get("user-agent")!);
  const canInstallPWA =
    browser.getOSName() === "iOS" && browser.getBrowserName() === "Safari";

  const userId = session?.user.id;
  const email = session?.user.email;
  let profileSlug$: Observable<string | undefined>;
  // let stripeCustomerId$: Observable<string | undefined>;
  let activeSubscription$: Observable<
    { id: number; managingUserId: string } | undefined
  >;

  if (userId) {
    profileSlug$ = from(getProfileByUserId(userId)).pipe(
      shareReplay(1),
      map((profile) => profile?.profileSlug)
    );
    // stripeCustomerId$ = from(getStripeCustomerId(db, userId)).pipe(
    //   shareReplay(1)
    // );
    activeSubscription$ = from(getActiveSubscriptionForUserId(db, userId)).pipe(
      shareReplay(1)
    );
  } else {
    profileSlug$ = of(undefined);
    // stripeCustomerId$ = of(undefined);
    activeSubscription$ = of(undefined);
  }

  return (
    <div
      className={cn(
        `w-full flex items-start justify-between p-4 gap-4 hidden-print `,
        className
      )}
    >
      {canInstallPWA && <SafariInstallPrompt />}
      <div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost">
              <GripVerticalIcon
              // className={isPopoverOpen ? "transform rotate-90" : ""}
              />
            </Button>
          </SheetTrigger>
          <SheetOverlay />
          <SheetContent side="left" className="w-80 flex flex-col gap-4 p-3">
            <MainMenu />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1 flex justify-center">
        <Link href="/">
          <TypeLogo className="h-16" />
        </Link>
      </div>

      <div>
        <Button variant="outline" event={{ type: "NEW_RECIPE" }}>
          <AxeIcon />
        </Button>
      </div>
    </div>
  );
}

export async function HeaderLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        `w-full flex items-start justify-between p-4 gap-4 hidden-print `,
        className
      )}
    >
      <div>
        <Button variant="ghost" className="animate-spin">
          <GripVerticalIcon />
        </Button>
      </div>

      <div className="flex-1 flex justify-center">
        <Link href="/">
          <TypeLogo className="h-16 animate-bounce" />
        </Link>
      </div>

      <div>
        <Button
          className="animate-spin"
          variant="outline"
          event={{ type: "NEW_RECIPE" }}
        >
          <AxeIcon />
        </Button>
      </div>
    </div>
  );
}

import { Badge } from "@/components/display/badge";
import Image from "next/image";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { SubscriptionMembersTable, db } from "@/db";
import {
  findUserById,
  getActiveSubscriptionForUserId,
  getProfileByUserId,
} from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";

export default async function Page() {
  const session = await getSession();
  const userId = session?.user.id;
  const activeSubscription = userId
    ? await getActiveSubscriptionForUserId(db, userId)
    : undefined;
  const profile = userId ? await getProfileByUserId(userId) : undefined;

  const members =
    userId && activeSubscription
      ? await db
          .select()
          .from(SubscriptionMembersTable)
          .where(
            and(
              eq(
                SubscriptionMembersTable.subscriptionId,
                activeSubscription.id
              ),
              eq(SubscriptionMembersTable.status, "active")
            )
          )
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-8">
        {!activeSubscription ? (
          <>
            <div className="max-w-xl mx-auto w-full px-4">
              <Card className="w-full">
                <div className="relative">
                  <div className="w-full z-20 text-white bottom-4 sm:bottom-16 absolute text-center">
                    <h1 className="font-semibold text-xl">
                      Join the Chef&apos;s Club
                    </h1>
                    <p className="text-sm">
                      The fastest way to make and share recipes.
                    </p>
                  </div>
                  <Image
                    src="/chefsclub.png"
                    className="rounded-t-lg border-b-2 border-solid border-primary-foreground"
                    width={1536}
                    height={768}
                    sizes="100vw"
                    alt="Chef's Club"
                  />
                </div>
                <div className="px-4 py-2">
                  <Label className="text-muted-foreground">
                    Member benefits include:
                  </Label>
                  <ul className="list-disc pl-6 flex flex-col gap-2 my-4">
                    <li>Unlimited recipes</li>
                    <li>No daily quotas</li>
                    <li>Ad-free experience</li>
                    <li>
                      Reserved username{" "}
                      <span className="italic">
                        {profile ? (
                          <span className="font-semibold">
                            @{profile.profileSlug}
                          </span>
                        ) : (
                          <span className="font-semibold">[YOUR_USERNAME]</span>
                        )}
                      </span>
                    </li>
                    <li>Share with up to 5 friends or family</li>
                  </ul>
                </div>
              </Card>
            </div>

            <div className="flex flex-row gap-4 carousel carousel-center pl-4 pr-8 sm:justify-center">
              <Link href="/checkout?plan=annual" className="carousel-item">
                <Card className="text-center flex flex-col w-56">
                  <div className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-t-md text-sm py-4 font-medium">
                    Biggest Savings
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div className="flex flex-col gap-2 items-center justify-start pt-4">
                      <h3 className="font-semibold text-xl">Annual</h3>
                      <div className="flex flex-row gap-1">
                        <span>$8</span>
                        <span>per month</span>
                      </div>
                      <div className="flex flex-row gap-1 text-muted-foreground">
                        <span>$96</span>
                        <span>every year</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-8">
                      <div>
                        <Badge variant="outline">Save $45</Badge>
                      </div>
                      <h4 className="text-sm text-muted-foreground">
                        30 days free
                      </h4>
                      <Button size="lg" className="rounded-t-none mt-3">
                        Start Trial
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/checkout?plan=quarterly" className="carousel-item">
                <Card className="text-center flex flex-col w-56">
                  <div className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-t-md text-sm py-4 font-medium">
                    Most Popular
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div className="flex flex-col gap-2 items-center justify-start pt-4">
                      <h3 className="font-semibold text-xl">Quarterly</h3>
                      <div className="flex flex-row gap-1">
                        <span>$12</span>
                        <span>per month</span>
                      </div>
                      <div className="flex flex-row gap-1 text-muted-foreground">
                        <span>$36</span>
                        <span>every 3 months</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-8">
                      <div>
                        <Badge variant="outline">Save $9</Badge>
                      </div>
                      <h4 className="text-sm text-muted-foreground">
                        14 days free
                      </h4>
                      <Button size="lg" className="rounded-t-none mt-3">
                        Start Trial
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/checkout?plan=monthly" className="carousel-item">
                <Card className="text-center flex flex-col gap-2 w-56">
                  <div className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-t-md text-sm py-4 font-medium">
                    <span className="opacity-0">spacer</span>
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div className="flex flex-col gap-2 items-center justify-start pt-4">
                      <h3 className="font-semibold text-xl">Monthly</h3>
                      <div className="flex flex-row gap-1">
                        <span>$15</span>
                        <span>per month</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm text-muted-foreground">
                        7 days free
                      </h4>
                      <Button size="lg" className="rounded-t-none mt-3">
                        Start Trial
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </>
        ) : (
          <div>
            <h1>You&apos;re In The Club!</h1>
            {members && members.length ? (
              members.map((member) => {
                const Content = async () => {
                  const user = await findUserById(db, member.userId);
                  return <p>{user.email}</p>;
                };

                return (
                  <Card className="px-4 py-2" key={member.id}>
                    <Suspense fallback={<Skeleton className="w-full h-14" />}>
                      <Content />
                    </Suspense>
                  </Card>
                );
              })
            ) : (
              <></>
            )}
            {activeSubscription.managingUserId === userId && (
              <div>
                <Link href="/chefs-club/manage">
                  <Badge>Manage Friends & Family</Badge>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

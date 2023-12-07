import { Button } from "@/components/input/button";
import { SubscriptionMembersTable, db } from "@/db";
import { findUserById, getActiveSubscriptionForUserId } from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { and, eq, ne } from "drizzle-orm";
import Link from "next/link";
import { Header } from "../header";
import { Card } from "@/components/display/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/display/skeleton";
import { Badge } from "@/components/display/badge";

export default async function Page() {
  const session = await getSession();
  const userId = session?.user.id;
  const activeSubscription = userId
    ? await getActiveSubscriptionForUserId(db, userId)
    : undefined;

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
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <Header />
      {!activeSubscription ? (
        <div>
          <h1>Join the Chef&apos;s Club</h1>
          <ul className="list-disc pl-6">
            <li>Unlimited recipes.</li>
            <li>No ads.</li>
            <li>Share with 5 friends or family.</li>
          </ul>
          <Link href="/checkout">
            <Button>Upgrade Now</Button>
          </Link>
        </div>
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
  );
}

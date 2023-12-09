import { Header } from "@/app/header";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { Progress } from "@/components/feedback/progress";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { SubscriptionMembersTable, UsersTable, db } from "@/db";
import {
  findUserById,
  getMembersBySubscriptionId,
  getSubscriptionByUserId,
  getUserByEmail,
  updateMemberStatusInSubscription,
} from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { randomUUID } from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

export default async function Page() {
  const session = await getSession();
  const userId = session?.user.id;
  const email = session?.user.email;
  if (!userId || !email) {
    return redirect(`/chefs-club`);
  }
  const subscription = await getSubscriptionByUserId(db, userId);
  if (!subscription) {
    return redirect("/chefs-club");
  }
  const members = await getMembersBySubscriptionId(db, subscription.id);

  const addMember = async (subscriptionId: number, formData: FormData) => {
    "use server";

    const email = z.string().email().parse(formData.get("email"));

    await db.transaction(async (transaction) => {
      const user = await getUserByEmail(transaction, email);
      let userId: string;
      if (!user) {
        userId = randomUUID();
        await transaction.insert(UsersTable).values({
          id: userId,
          email,
        });
      } else {
        userId = user.id;
      }

      const query = await db
        .select()
        .from(SubscriptionMembersTable)
        .where(
          and(
            eq(SubscriptionMembersTable.subscriptionId, subscriptionId),
            eq(SubscriptionMembersTable.userId, userId)
          )
        )
        .execute();
      const existingMember = query[0];

      if (existingMember) {
        await updateMemberStatusInSubscription(
          transaction,
          existingMember.id,
          "active"
        );
      } else {
        // create the user if not exists
        await transaction.insert(SubscriptionMembersTable).values({
          userId,
          subscriptionId,
        });
      }
    });

    revalidatePath("/chefs-club/manage");
    redirect("/chefs-club/manage?added=1");
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <Header />
      <div>
        <h1 className="text-xl">Manage Family & Friends</h1>
        <p className="text-muted-foreground textmd">
          Invite family and friends to enjoy the benefits of your Chef&apos;s
          Club Subscription
        </p>
      </div>
      <form
        action={addMember.bind(null, subscription.id)}
        className="flex flex-col gap-1"
      >
        <Label htmlFor="email">Email to Invite</Label>
        <Input name="email" type="email" autoComplete="off" />
        <Button className="w-full" size="lg" type="submit">
          Invite
        </Button>
      </form>
      <Separator />
      <Progress value={(members.length / 5) * 100} />
      <Label>Existing Members ({members.length} / 5)</Label>
      {members.length ? (
        members.map((member) => {
          const Content = async () => {
            const user = await findUserById(db, member.userId);

            const remove = async (userId: string) => {
              "use server";
              await updateMemberStatusInSubscription(db, member.id, "removed");

              revalidatePath("/chefs-club/manage");
              redirect("/chefs-club/manage?removed=1");
            };

            return (
              <form
                className="flex flex-row justify-between items-center"
                action={remove.bind(null, user.id)}
              >
                <p>{user.email}</p>
                <Button type="submit" variant="ghost">
                  Remove
                </Button>
              </form>
            );
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
        <p className="text-muted-foreground text-xs">No members added yet.</p>
      )}
    </div>
  );
}

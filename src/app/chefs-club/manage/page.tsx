import Image from "next/image";
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
  getProfileByUserId,
  getSubscriptionByUserId,
  getUserByEmail,
  updateMemberStatusInSubscription,
} from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { getOrigin } from "@/lib/headers";
import { resend } from "@/lib/resend";
import { assert } from "@/lib/utils";
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

  const addMember = async (
    subscriptionId: number,
    invitingUserId: string,
    formData: FormData
  ) => {
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

    // send email
    (async () => {
      const invitingUserProfile = await getProfileByUserId(invitingUserId);
      assert(invitingUserProfile, "expected profile");

      const origin = getOrigin();
      const result = await resend.emails.send({
        from: "KitchenCraft Chefs Club <chefsclub@mail.kitchencraft.ai>",
        to: email,
        subject: `${invitingUserProfile.profileSlug} gave you a Chef's Club membership!`,
        text: `Hello,

          You've been invited to join KitchenCraft's Chef's Club by ${invitingUserProfile.profileSlug}. As a member, you can enjoy:
          
          1) Unlimited recipe generations with our crafting tools.
          2) An ad-free experience.
          3) Your reserved chef username and recipe page.
          
          Get started by clicking the link and signing in with your email: 
          [Link: ${origin}/?guestEmail=${email}&subscriptionId=${subscriptionId}]
          
          Welcome to KitchenCraft.
          
          Best,
          The KitchenCraft Chefs Club Team
          `,
        html: `<html>
          <body>
              <p>Hello,</p>
              <p>You've been invited to join KitchenCraft's Chef's Club by <strong>${invitingUserProfile.profileSlug}</strong>. As a member, you can enjoy:</p>
              <ul>
                  <li>Unlimited recipe generations with our crafting tools.</li>
                  <li>An ad-free experience.</li>
                  <li>Your reserved chef username and recipe page.</li>
              </ul>
              <p>Get started by clicking the link and signing in with your email:</p>
              <p><a href="${origin}/?guestEmail=${email}&subscriptionId=${subscriptionId}">Join Now</a></p>
              <p>Welcome to KitchenCraft.</p>
              <p>Best,</p>
              <p><strong>The KitchenCraft Chefs Club Team</strong></p>
          </body>
      </html>`, // todo
      });
      if (result.error) {
        console.error("failed sending email");
        console.error(result.error);
      }
    })();

    redirect("/chefs-club/manage?added=1");
  };

  return (
    <>
      <div className="relative">
        <div className="w-full z-20 text-white bottom-10 sm:bottom-16 absolute text-center">
          <h1 className="font-semibold text-xl">Manage Family & Friends</h1>
          <p className="text-sm">
            Invite family and friends to enjoy the benefits of your Chef&apos;s
            Club Subscription
          </p>
        </div>
        <Image
          src="/chefsclub.png"
          className="rounded-t-lg"
          width={1536}
          height={768}
          sizes="100vw"
          alt="Chef's Club"
        />
      </div>
      <div className="max-w-2xl mx-auto flex flex-col gap-4 p-4">
        <form
          action={addMember.bind(null, subscription.id).bind(null, userId)}
          className="flex flex-col gap-2"
        >
          <Label htmlFor="email">Email to Invite</Label>
          <Input name="email" type="email" autoComplete="off" />
          <Button className="w-full" size="lg" type="submit">
            Invite
          </Button>
        </form>
      </div>
      <Separator />
      <div className="max-w-2xl mx-auto flex flex-col gap-4 p-4">
        <Progress value={(members.length / 5) * 100} />
        <Label>Existing Members ({members.length} / 5)</Label>
        {members.length ? (
          members.map((member) => {
            const Content = async () => {
              console.log({ member });
              console.log(member.userId);
              const user = await findUserById(db, member.userId);

              const remove = async (userId: string) => {
                "use server";
                await updateMemberStatusInSubscription(
                  db,
                  member.id,
                  "removed"
                );

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
    </>
  );
}

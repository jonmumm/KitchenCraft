import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Button } from "@/components/input/button";
import { db } from "@/db";
import { getProfileByUserId, getStripeCustomerId } from "@/db/queries";
import { getUserId } from "@/lib/session";
import { assert } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const userId = await getUserId();
  if (!userId) {
    return redirect(`/chefs-club`);
  }
  const profile = await getProfileByUserId(userId);
  assert(profile, "expected profile to be created");

  const stripeCustomerId = await getStripeCustomerId(db, userId);
  assert(stripeCustomerId, "expected customer id to be created");

  // const customer = await stripe.customers.retrieve(stripeCustomerId);

  return (
    <div>
      <div className="relative">
        <div className="w-full z-20 text-white bottom-10 sm:bottom-16 absolute text-center">
          <h1 className="font-semibold text-xl">Welcome to the club</h1>
          <p className="text-sm">We&apos;re pleased to welcome you</p>
        </div>
        <Image
          src="/chefsclub.png"
          className="2xl:rounded-lg 2xl:mx-auto"
          width={1536}
          height={768}
          sizes="100vw"
          alt="Chef's Club"
        />
      </div>
      <div className="max-w-2xl mx-auto w-full">
        <div className="relative">
          <Card className="p-6 absolute z-20 left-4 right-4 -top-8 rounded-2xl">
            <Label className="text-muted-foreground">
              Your Chef&apos;s Club benefits:
            </Label>
            <ul className="list-disc pl-6 flex flex-col gap-2 my-4">
              <li>Unlimited recipes</li>
              <li>No ads</li>
              <li>
                Reserved username{" "}
                <span className="italic">
                  <span className="font-semibold">@{profile.profileSlug}</span>
                </span>
              </li>
              <li>Share with up to 5 friends or family</li>
            </ul>
            <div className="flex flex-col gap-2">
              <Link href="/chefs-club/manage">
                <Button className="w-full">Manage Family & Friends</Button>
              </Link>
              {/* <Link href={`/@${profile.profileSlug}`}>
                <Button className="w-full flex flex-row gap-1">
                  <ChefHatIcon size={16} />
                  {profile.profileSlug}
                </Button>
              </Link> */}
            </div>
          </Card>
        </div>
        {/* <Link href="/chefs-club/manage">
          <Button>Manage Friends & Family</Button>
        </Link>
        <Link href="/account">
          <Button>Change Username</Button>
        </Link>
         */}
      </div>
    </div>
  );
}

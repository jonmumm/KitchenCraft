import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { db } from "@/db";
import { updateProfileName } from "@/db/queries";
import { getCurrentProfile, getCurrentUserId } from "@/lib/auth/session";
import { assert } from "@/lib/utils";
import { redirect } from "next/navigation";
import { z } from "zod";

export default async function Page() {
  const profile = await getCurrentProfile();

  async function saveProfileName(formData: FormData) {
    "use server";
    const profileNameSchema = z.string();
    const name = profileNameSchema.parse(formData.get("name"));

    const currentUserId = await getCurrentUserId();
    assert(currentUserId, "expected user to be logged in");

    // todo handle error here...
    // if name already taken..
    await updateProfileName(db, currentUserId, name);

    // TODO write a database query that updates
    // the users profile name if it is available
    redirect(
      `/account?message=${encodeURIComponent(
        `Profile name updated to ${name}!`
      )}`
    );
  }

  if (!profile) {
    redirect("/account");
  }
  // todo an email edit form
  return (
    <Card className="max-w-3xl p-4 m-4 sm:mx-auto">
      <form action={saveProfileName}>
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="font-semibold text-lg">Edit Profile Name</h1>
            <p className="text-muted-foreground">
              This is your profile profile name visible on your recipes.
            </p>
          </div>
          <Label htmlFor="name">Current</Label>
          <div className="flex flex-row gap-2 items-center">
            <Input
              className="border-none"
              defaultValue={profile.profileSlug}
              disabled
              type="text"
            />
          </div>
          <Label htmlFor="editEmail">New</Label>
          <div className="flex flex-row gap-2 items-center">
            <Input
              autoFocus
              name="name"
              pattern="[a-z0-9_-]+"
              required
              type="text"
            />
          </div>
          <div className="flex flex-row justify-between">
            <Button size="lg" className="w-full" type="submit">
              Save
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

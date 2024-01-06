import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { ChefHatIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function Page() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/account");
  }
  // todo an email edit form
  return (
    <Card className="max-w-3xl p-4 m-4 sm:mx-auto">
      <div className="flex flex-col gap-3">
        <Label htmlFor="name">Current Profile Name</Label>
        <div className="flex flex-row gap-2 items-center">
          <ChefHatIcon className="mx-4" />
          <Input
            id="currentName"
            defaultValue={profile.profileSlug}
            disabled
            required
            type="text"
          />
        </div>
        <Label htmlFor="editEmail">New Profile Name</Label>
        <div className="flex flex-row gap-2 items-center">
          <ChefHatIcon className="mx-4" />
          <Input id="name" pattern="[a-z0-9_-]+" required type="email" />
        </div>
        <Button className="w-full" disabled type="submit">
          Save
        </Button>
      </div>
    </Card>
  );
}

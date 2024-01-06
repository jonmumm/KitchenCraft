/**
 * v0 by Vercel.
 * @see https://v0.dev/t/RBAbrfzN6tP
 */

import { Badge } from "@/components/display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { getProfileByUserId } from "@/db/queries";
import {
  getCurrentEmail,
  getCurrentProfile,
  getCurrentUserId,
  getSession,
} from "@/lib/auth/session";
import { ChefHatIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const [userId, email, profile] = await Promise.all([
    getCurrentUserId(),
    getCurrentEmail(),
    getCurrentProfile(),
  ]);

  if (!userId || !email) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="space-y-8">
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex flex-row justify-between">
            <CardTitle className="text-2xl font-bold">Account</CardTitle>
            <Settings2Icon />
          </div>
          <CardDescription>Manage your account details below.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Username</h2>
                <Link
                  className="text-sm text-blue-500 hover:underline"
                  href="/account/edit/profile"
                >
                  Edit
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <Badge>
                  <div className="flex flex-row gap-1 items-center">
                    <ChefHatIcon />{" "}
                    <span className="p-1">{profile?.profileSlug}</span>
                  </div>
                </Badge>
                <Badge variant="successOutline">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Email</h2>
                <Link
                  className="text-sm text-blue-500 hover:underline"
                  href="/account/edit/email"
                >
                  Edit
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-500 dark:text-gray-400">{email}</p>
                <Badge variant="warning">Unverified</Badge>
              </div>
            </div>
          </div>

          {/* <div className="space-y-2">
              <Label>Current Email</Label>
              <p className="p-2 rounded">{email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">New Email</Label>
              <Input
                id="editEmail"
                pattern='"[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,4}$"'
                placeholder="m@example.com"
                required
                type="email"
              />
              <Badge className="mt-1" variant="warning">
                Please ensure your email is in the correct format.
              </Badge>
            </div>
            <div className="flex justify-between">
              <Button className="w-1/2 mr-2" disabled variant="outline">
                Cancel
              </Button>
              <Button className="w-1/2 ml-2" disabled type="submit">
                Save Changes
              </Button>
            </div> */}
        </CardContent>
      </Card>
      {/* <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Edit Username</CardTitle>
          <CardDescription>Update your username below.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div></div>
              <Label>Current Username</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUsername">New Username</Label>
              <Input
                id="editUsername"
                pattern="^[a-zA-Z0-9_]*$"
                placeholder="username"
                required
                type="text"
              />
            </div>
            <div className="flex justify-between">
              <Button className="w-1/2 mr-2" disabled variant="outline">
                Cancel
              </Button>
              <Button className="w-1/2 ml-2" disabled type="submit">
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </main>
  );
}

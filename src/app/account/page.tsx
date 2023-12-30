/**
 * v0 by Vercel.
 * @see https://v0.dev/t/RBAbrfzN6tP
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId, getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function Page() {
  const [session, userId] = await Promise.all([
    getSession(),
    getCurrentUserId(),
  ]);
  const email = session?.user.email;
  if (!userId || !email) {
    redirect("/auth/sign-in");
  }
  const profile = await getProfileByUserId(userId);

  return (
    <main className="space-y-8">
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Edit Email</CardTitle>
          <CardDescription>Update your email below.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
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
              {/* <Badge className="mt-1" variant="warning">
                Please ensure your email is in the correct format.
              </Badge> */}
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
      </Card>
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Edit Username</CardTitle>
          <CardDescription>Update your username below.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Username</Label>
              <p className="p-2 rounded">{profile?.profileSlug}</p>
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
              {/* <Badge className="mt-1" variant="warning">
                Username cannot be empty.
              </Badge> */}
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
      </Card>
    </main>
  );
}

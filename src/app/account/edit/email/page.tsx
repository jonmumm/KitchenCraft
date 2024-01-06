import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { getCurrentEmail } from "@/lib/auth/session";

export default async function Page() {
  const email = await getCurrentEmail();
  // todo an email edit form
  return (
    <Card className="max-w-3xl p-4 m-4 sm:mx-auto">
      <div className="flex flex-col gap-3">
        <Label>Current Email</Label>
        <Input
          id="email"
          defaultValue={email || ""}
          disabled
          pattern='"[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,4}$"'
          placeholder="m@example.com"
          required
          type="email"
        />
        <Label htmlFor="editEmail">New Email</Label>
        <Input
          id="editEmail"
          autoFocus
          pattern='"[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,4}$"'
          placeholder="m@example.com"
          required
          type="email"
        />
        {/* <div>
          <Badge variant="warning">
            Please ensure your email is in the correct format.
          </Badge>
        </div> */}
        <Label htmlFor="editEmail">Confirm Email</Label>
        <Input
          id="confirmEmail"
          pattern='"[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,4}$"'
          placeholder="m@example.com"
          required
          type="email"
        />
        {/* <div>
          <Badge variant="warning">
            Please ensure your email is in the correct format.
          </Badge>
        </div> */}
        <Button className="w-full" disabled type="submit">
          Update
        </Button>
      </div>
    </Card>
  );
}

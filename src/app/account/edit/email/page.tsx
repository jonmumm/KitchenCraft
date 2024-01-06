import { Label } from "@/components/display/label";
import { Button } from "@/components/input/button";

export default async function Page() {
  // todo an email edit form
  return (
    <>
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
      </div>{" "}
    </>
  );
}

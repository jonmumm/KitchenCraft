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
import { SendHorizonalIcon } from "lucide-react";

export const ShareDetailsCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Details</CardTitle>
        <CardDescription>Review options then send.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="py-4 flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-2">
            <Label className="font-semibold">Name (optional)</Label>
            <Input type="text" placeholder="Shared Thursday June 13" />
          </div>
          {/* <div>
            <Badge variant="secondary">Change</Badge>
          </div> */}
        </div>
      </CardContent>
      <Separator />
      <CardContent className="py-4 flex flex-col gap-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Share URL</p>
          <div className="flex flex-row gap-2 items-center card-bordered border-muted rounded-lg p-2">
            <div className="flex-1">
              <span className="break-all text-muted-foreground">
                kitchencraft.ai/@InspectorT/wef382-sunday-june-12-2023-10-23am
              </span>
            </div>
          </div>
        </div>
        <Button size="xl">
          <span>Send</span>
          <SendHorizonalIcon className="ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

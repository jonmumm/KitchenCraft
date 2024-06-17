"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import CanShare from "@/components/features/can-share";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { selectSelectedRecipeCount } from "@/selectors/page-session.selectors";
import { ClipboardCopyIcon, SendHorizonalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ShareDetailsPreviewCarousel } from "./share-details-preview-carousel";

export const ShareDetailsCard = () => {
  const t = useTranslations("ShareDetails");

  const selectedRecipeCount = usePageSessionSelector(selectSelectedRecipeCount);

  return (
    <Card className="max-w-3xl overflow-hidden">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("recipesCount", { count: selectedRecipeCount })}
        </CardDescription>
      </CardHeader>
      <div className="max-w-full">
        <ShareDetailsPreviewCarousel />
      </div>
      <Separator className="my-4" />
      <CardContent className="py-4 flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-3 items-center w-full">
            <Label className="font-semibold text-center">
              Give this list a name:
            </Label>
            <Input
              className="text-center"
              type="text"
              placeholder="Shared June 13"
            />
            <div className="text-muted-foreground text-sm text-center">
              (Optional)
            </div>
          </div>
          {/* <div>
            <Badge variant="secondary">Change</Badge>
          </div> */}
        </div>
      </CardContent>
      <CardContent className="py-4 flex flex-col gap-2 mb-4">
        <CanShare not>
          <Button size="xl">
            <span>Copy Link</span>
            <ClipboardCopyIcon className="ml-2" />
          </Button>
        </CanShare>
        <CanShare>
          <Button size="xl">
            <span>Send</span>
            <SendHorizonalIcon className="ml-2" />
          </Button>
        </CanShare>
      </CardContent>
    </Card>
  );
};

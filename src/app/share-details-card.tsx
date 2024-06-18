"use client";

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
import { SkeletonSentence } from "@/components/display/skeleton";
import CanShare from "@/components/features/can-share";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import {
  selectSelectedRecipeCount,
  selectSharingListIsCreated,
  selectSharingListPath,
} from "@/selectors/page-session.selectors";
import { useStore } from "@nanostores/react";
import {
  ClipboardCopyIcon,
  Loader2Icon,
  SendHorizonalIcon,
  XIcon,
} from "lucide-react";
import { atom } from "nanostores";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ShareDetailsPreviewCarousel } from "./share-details-preview-carousel";

export const ShareDetailsCard = () => {
  const t = useTranslations("ShareDetails");

  const selectedRecipeCount = usePageSessionSelector(selectSelectedRecipeCount);

  const sharingListIsCreated = usePageSessionSelector(
    selectSharingListIsCreated
  );

  return (
    <Card className="max-w-3xl overflow-hidden">
      <CardHeader className="flex flex-row justify-between">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("recipesCount", { count: selectedRecipeCount })}
          </CardDescription>
        </div>
        <div>
          <Button variant="ghost" size="icon" event={{ type: "CANCEL" }}>
            <XIcon />
          </Button>
        </div>
      </CardHeader>
      <div className="max-w-full">
        <ShareDetailsPreviewCarousel />
      </div>
      <Separator className="my-4" />
      <CardContent className="py-4 flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-3 items-center w-full">
            <ShareNameRow />
          </div>
        </div>
      </CardContent>
      <CardContent className="py-4 flex flex-col gap-2 mb-4">
        <CanShare not>
          <Button autoFocus={false} size="xl" disabled={!sharingListIsCreated}>
            {sharingListIsCreated ? (
              <>
                <span>Copy Link</span>
                <ClipboardCopyIcon className="ml-2" />
              </>
            ) : (
              <>
                <span>Creating</span>
                <Loader2Icon className="ml-2 animate-spin" />
              </>
            )}
          </Button>
        </CanShare>
        <CanShare>
          <Button autoFocus={false} size="xl" disabled={!sharingListIsCreated}>
            {sharingListIsCreated ? (
              <>
                <span>Send</span>
                <SendHorizonalIcon className="ml-2" />
              </>
            ) : (
              <>
                <span>Creating</span>
                <Loader2Icon className="ml-2 animate-spin" />
              </>
            )}
          </Button>
        </CanShare>
      </CardContent>
    </Card>
  );
};

const ShareNameRow = () => {
  const [editing$] = useState(atom(false));
  const editing = useStore(editing$);

  useEventHandler("PRESS_BUTTON", () => {
    editing$.set(true);
  });

  const shareName = usePageSessionSelector(
    (state) => state.context.shareNameInput
  );

  return (
    <div className="flex flex-row justify-between items-center w-full">
      <div className="flex flex-col gap-2 items-start w-full flex-1">
        <Label className="text-muted-foreground uppercase text-xs">Name</Label>
        {!editing ? (
          <h4 className="font-semibold">
            {shareName ? (
              <>{shareName}</>
            ) : (
              <SkeletonSentence numWords={3} className="h-6" />
            )}
          </h4>
        ) : (
          <>
            <Input type="text" defaultValue={shareName} />
            <p>
              <span className="text-muted-foreground text-xs">
                You recipes will be available at
              </span>
              <br /> kitchencraft.ai
              <span className="font-semibold">
                <SharingRecipeListPath />
              </span>
            </p>
          </>
        )}
      </div>
      <div>
        {!editing && (
          <Badge
            event={{
              type: "PRESS_BUTTON",
              buttonId: "CHANGE_SHARE_NAME",
            }}
            variant="outline"
          >
            Change
          </Badge>
        )}
      </div>
    </div>
  );
};

const SharingRecipeListPath = () => {
  const path = usePageSessionSelector(selectSharingListPath);
  return <>{path}</>;
};

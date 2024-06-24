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
import { atomBooleanComponent } from "@/components/util/atom-boolean-component";
import { PageSessionMatches } from "@/components/util/page-session-matches";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionMatchesState } from "@/hooks/usePageSessionMatchesState";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSend } from "@/hooks/useSend";
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
import { useRouter } from "next/navigation";
import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { ShareDetailsPreviewCarousel } from "./share-details-preview-carousel";

export const ShareDetailsCard = () => {
  const t = useTranslations("ShareDetails");
  const router = useRouter();

  const nameIsTaken = usePageSessionMatchesState({ Share: { Name: "Taken" } });
  const nameIsAvailable = usePageSessionMatchesState({
    Share: { Name: "Available" },
  });
  const nameIsChecking = usePageSessionMatchesState({
    Share: { Name: "Checking" },
  });
  const nameCheckWaiting = usePageSessionMatchesState({
    Share: { Name: "Waiting" },
  });
  const selectedRecipeCount = usePageSessionSelector(selectSelectedRecipeCount);

  const sharingListIsCreated = usePageSessionSelector(
    selectSharingListIsCreated
  );

  const send = useSend();
  const store = usePageSessionStore();

  const handleCopyLink = useCallback(() => {
    const path = selectSharingListPath(store.get());
    const { origin } = window.location;
    const url = `${origin}${path}`;
    navigator.clipboard.writeText(url);
    router.push(url);
  }, [store, router]);

  useEventHandler("COPY_LINK", handleCopyLink);

  const handlePressSend = useCallback(() => {
    const path = selectSharingListPath(store.get());
    const { origin } = window.location;
    const url = `${origin}${path}`;
    router.push(url);

    send({ type: "SHARE_PRESS", url });

    if ("share" in navigator) {
      navigator
        .share({
          title: store.get().context.shareNameInput,
          url,
        })
        .then(() => {
          send({ type: "SHARE_COMPLETE", url });
        })
        .catch(() => {
          send({ type: "SHARE_CANCEL", url });
        });
    }
  }, [router, send, store]);

  return (
    <Card className="max-w-3xl overflow-hidden">
      <CardHeader className="flex flex-row justify-between">
        <PageSessionMatches
          matchedState={{ Share: { Record: "Complete" } }}
          not
        >
          <IsEditingName>
            <div>
              <CardTitle>Share Name</CardTitle>
              <CardDescription className="text-xs mt-2">
                To be available @
                <div className="border border-muted rounded-lg border-solid p-2 mt-3 bg-secondary">
                  kitchencraft.ai
                  <SharingRecipeListPath />
                </div>
              </CardDescription>
            </div>
          </IsEditingName>
          <IsEditingName not>
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
          </IsEditingName>
        </PageSessionMatches>
        <PageSessionMatches matchedState={{ Share: { Record: "Complete" } }}>
          <CanShare not>
            <div className="w-full">
              <CardTitle className="flex flex-row gap-2 justify-between items-center">
                <div className="flex flex-row gap-2 flex-1">
                  <ClipboardCopyIcon />
                  <span>Link Copied!</span>
                </div>
              </CardTitle>
              <CardDescription className="text-xs mt-2">
                <div>The URL has been copied to your clipboard to share:</div>
                <div className="border border-muted rounded-lg border-solid bg-secondary p-2 mt-3">
                  kitchencraft.ai
                  <SharingRecipeListPath />
                </div>
              </CardDescription>
            </div>
          </CanShare>
        </PageSessionMatches>
      </CardHeader>
      <PageSessionMatches matchedState={{ Share: { Record: "Complete" } }} not>
        <IsEditingName not>
          <div className="max-w-full">
            <ShareDetailsPreviewCarousel />
          </div>
          <Separator className="my-4" />
        </IsEditingName>
        <CardContent className="py-4 flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <div className="flex flex-col gap-2 w-full">
              <ShareNameRow />
              <IsEditingName>
                {nameIsAvailable && (
                  <div className="text-xs test-semibold text-success opacity-0">
                    Available
                  </div>
                )}
                {nameCheckWaiting && (
                  <div className="text-muted-foreground text-xs flex flex-row gap-2 opacity-0">
                    <span>Inputting</span>
                  </div>
                )}
                {nameIsChecking && (
                  <div className="text-muted-foreground text-xs flex flex-row gap-2">
                    <span>Checking</span>
                    <Loader2Icon size={14} className="animate-spin ml-1" />
                  </div>
                )}
              </IsEditingName>
              {nameIsTaken && (
                <div className="text-error text-xs">
                  This name is not available.
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardContent className="py-4 flex flex-col gap-2 mb-4">
          <IsEditingName>
            <Button
              size="xl"
              disabled={!sharingListIsCreated || nameIsTaken}
              onClick={() => {
                editingName$.set(false);
              }}
            >
              Done
            </Button>
          </IsEditingName>
          <IsEditingName not>
            <CanShare not>
              <Button
                autoFocus={false}
                size="xl"
                event={{ type: "COPY_LINK" }}
                disabled={!sharingListIsCreated || nameIsTaken}
              >
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
              <Button
                autoFocus={false}
                size="xl"
                disabled={!sharingListIsCreated || nameIsTaken}
                onClick={handlePressSend}
              >
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
          </IsEditingName>
        </CardContent>
      </PageSessionMatches>
    </Card>
  );
};

const editingName$ = atom(false);

const IsEditingName = atomBooleanComponent(editingName$);

const ShareNameRow = () => {
  const editing = useStore(editingName$);
  const inputRef = useRef<HTMLInputElement>(null);
  const store = usePageSessionStore();

  useEventHandler("PRESS_BUTTON", () => {
    editingName$.set(true);
  });

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        0,
        store.get().context.shareNameInput?.length || 0
      );
    }
  }, [editing, inputRef, store]);

  const handleKeyDown: KeyboardEventHandler = useCallback((event) => {
    if (event.key === "Enter") {
      editingName$.set(false);
    }
  }, []);
  const send = useSend();
  const FIELD_NAME = "shareNameInput";

  const handleShareNameChange: ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (event) => {
        send({
          type: "CHANGE",
          name: FIELD_NAME,
          value: event.currentTarget.value,
        });
      },
      [send]
    );

  const handleBlur = useCallback(() => {
    // editing$.set(false);
    send({ type: "BLUR", name: FIELD_NAME });
  }, [send]);

  const shareName = usePageSessionSelector(
    (state) => state.context.shareNameInput
  );

  return (
    <div className="flex flex-row justify-between items-center w-full">
      <div className="flex flex-col gap-2 items-start w-full flex-1">
        <Label className="text-muted-foreground uppercase text-xs">Name</Label>
        <IsEditingName not>
          <h4 className="font-semibold">
            {shareName ? (
              <>{shareName}</>
            ) : (
              <SkeletonSentence numWords={3} className="h-6" />
            )}
          </h4>
        </IsEditingName>
        <IsEditingName>
          <Input
            ref={inputRef}
            onChange={handleShareNameChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            type="text"
            defaultValue={shareName}
          />
        </IsEditingName>
      </div>

      <div>
        {!editing && (
          <Badge
            event={
              shareName
                ? {
                    type: "PRESS_BUTTON",
                    buttonId: "CHANGE_SHARE_NAME",
                  }
                : undefined
            }
            variant="outline"
            className={!shareName ? "opacity-30" : ""}
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

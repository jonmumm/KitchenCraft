"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Button } from "@/components/input/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/input/form";
import { Input } from "@/components/ui/input-otp";
import { useAppContext } from "@/hooks/useAppContext";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { getPlatformInfo } from "@/lib/device";
import { selectUserEmail } from "@/selectors/page-session.selectors";
import { ExternalLinkIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { ClipboardEventHandler, useCallback, useEffect, useState } from "react";
import { AppSnapshot } from "./app-machine";

export default function EmailCodeCard() {
  //   const userAgent = getUserAgent();
  //   const browser = Bowser.getParser(userAgent);
  //   const isiOSSafari =
  //     browser.getOSName() === "iOS" && browser.getBrowserName() === "Safari";
  //   const isDesktop = getBrowser().getPlatformType() === "desktop";
  //   const showGMailLink = (isiOSSafari || isDesktop) && isGmail;
  //   const gmailLink = showGMailLink
  //     ? isDesktop
  //       ? "https://mail.google.com"
  //       : "googlegmail://"
  //     : undefined;
  const email = usePageSessionSelector(selectUserEmail);

  return (
    <Card className="overflow-x-hidden">
      <CardHeader className="flex flex-row gap-2">
        <div>
          <CardTitle className="animate-pulse">
            Check your email for a code.
          </CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-character code to <span>{email}</span>. The code
            expires shortly, so please enter it soon.
          </CardDescription>
        </div>
        <div>
          <Button event={{ type: "CANCEL" }} variant="ghost" autoFocus={false}>
            <XIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <EmailCodeForm />
      </CardContent>
    </Card>
  );
}

const selectGmailLink = (state: AppSnapshot) => {
  const isGmail = state.context.email?.endsWith("gmail.com");
  console.log({ isGmail });
  const platformInfo =
    typeof window !== "undefined" &&
    window.navigator.userAgent &&
    getPlatformInfo(window.navigator.userAgent);
  const showGMailLink =
    platformInfo &&
    (platformInfo.isIOSSafari || platformInfo.isDesktop) &&
    isGmail;
  if (showGMailLink) {
    return platformInfo.isDesktop
      ? "https://mail.google.com"
      : "googlegmail://";
  } else {
    return undefined;
  }
};

const GmailLink = () => {
  const actor = useAppContext();
  const gmailLink = useSelector(actor, selectGmailLink);

  const [hideGmailLink, setHideGmailLink] = useState(false);
  useEffect(() => {
    const handleTabBlur = () => setHideGmailLink(true);
    window.addEventListener("blur", handleTabBlur);

    return () => {
      window.removeEventListener("blur", handleTabBlur);
    };
  }, []);

  if (!gmailLink || hideGmailLink) {
    return null;
  }

  return (
    <Link href={gmailLink} target="_blank">
      <Button
        type="button"
        variant="secondary"
        className="w-full flex flex-row items-center-justify-center gap-1"
        size="lg"
      >
        <span>Open Gmail</span>
        <ExternalLinkIcon size={14} />
      </Button>
    </Link>
  );
};

const formSchema = z.object({
  code: z.string().length(5, { message: "Passcode must be 5 characters" }),
});

function EmailCodeForm() {
  const [disabled, setDisabled] = useState(false);
  const actor = useAppContext();
  const showGMailLink = useSelector(actor, (state) => selectGmailLink(state)!!);
  const send = useSend();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = useCallback(
    (data: z.infer<typeof formSchema>) => {
      setDisabled(true);
      send({ type: "SUBMIT", name: "email" });
    },
    [setDisabled, send]
  );

  const handleOnPaste: ClipboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const result = formSchema.safeParse({
        token: event.clipboardData.getData("text"),
      });
      if (result.success) {
        onSubmit(result.data);
      }
    },
    [onSubmit]
  );

  const handleInputChange: (newValue: string) => void = useCallback(
    (event) => {
      const newValue = event.toUpperCase();
      form.setValue("code", newValue);
      send({ type: "CHANGE", name: "signInCode", value: newValue });
    },
    [form, send]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const inputElement = document.querySelector(
          "#code"
        ) as HTMLInputElement | null;
        if (inputElement) {
          inputElement.focus();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <Input
                  id="code"
                  autoFocus={!showGMailLink}
                  maxLength={5}
                  disabled={disabled}
                  {...field}
                  onChange={handleInputChange}
                  onPaste={handleOnPaste}
                />
              </FormControl>
              <FormDescription>
                Enter the 5-letter code you received in your email.
              </FormDescription>
              {fieldState.error && (
                <FormMessage>{fieldState.error.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2">
          <Button
            disabled={disabled}
            type="submit"
            className="w-full"
            size="lg"
          >
            {disabled ? "Loading..." : "Submit"}
          </Button>
          <GmailLink />
        </div>
      </form>
    </Form>
  );
}

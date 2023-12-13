"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import ClientOnly from "@/components/util/client-only";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChangeEventHandler,
  ClipboardEventHandler,
  useCallback,
  useEffect,
  useState,
} from "react";

// Update the schema to validate a 5-character token
const formSchema = z.object({
  token: z.string().length(5, { message: "Passcode must be 5 characters" }),
});

export function PasscodeForm(props: { showGmailLink: boolean; email: string }) {
  // const router = useRouter();
  const [disabled, setDisabled] = useState(false);
  const params = useSearchParams();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
    },
  });

  const [showGMailLink, setShowGMailLink] = useState(props.showGmailLink);

  const submit = useCallback(
    (token: string) => {
      setDisabled(true);
      const emailCallbackParams = new URLSearchParams({
        email: props.email,
        token: token,
      });

      const callbackUrl = params.get("callbackUrl");
      if (callbackUrl) {
        emailCallbackParams.set("callbackUrl", callbackUrl);
      } else {
        emailCallbackParams.set("callbackUrl", "/");
      }

      const url = `/api/auth/callback/email?${emailCallbackParams.toString()}`;
      window.location.href = url;
    },
    [setDisabled, params, props.email]
  );

  const GmailLink = () => {
    useEffect(() => {
      const handleTabBlur = () => setShowGMailLink(false);
      window.addEventListener("blur", handleTabBlur);

      // Clean up the event listeners
      return () => {
        window.removeEventListener("blur", handleTabBlur);
      };
    }, []);

    if (!showGMailLink) {
      return null;
    }

    return (
      <Link href="googlegmail://">
        <Button type="button" variant="secondary" className="w-full" size="lg">
          Open Gmail App
        </Button>
      </Link>
    );
  };

  const handleOnPaste: ClipboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      // If it's valid submit it
      const result = formSchema.safeParse({
        token: event.clipboardData.getData("text"),
      });
      if (result.success) {
        submit(result.data.token);
      }
    },
    [submit]
  );

  const onSubmit = useCallback(
    (data: z.infer<typeof formSchema>) => {
      submit(data.token);
    },
    [submit]
  );

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const { value } = event.target;
      const newValue = value.toUpperCase();
      form.setValue("token", newValue);
    },
    [form]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="token"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Token</FormLabel>
              <FormControl>
                <Input
                  autoFocus={!showGMailLink}
                  disabled={disabled}
                  onPaste={handleOnPaste}
                  type="text"
                  placeholder="Enter your 5-digit token"
                  {...field}
                  onChange={handleInputChange} // Use the custom onChange handler
                />
              </FormControl>
              <FormDescription>
                Enter the 5-digit passcode you received at{" "}
                <span className="italic">{params.get("email")}</span>.
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
            Submit
          </Button>
          <GmailLink />
        </div>
      </form>
    </Form>
  );
}

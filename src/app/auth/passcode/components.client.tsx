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
import { assert } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { ClipboardEventHandler, useCallback, useState } from "react";

// Update the schema to validate a 5-character token
const formSchema = z.object({
  token: z.string().length(5, { message: "Passcode must be 5 characters" }),
});

export function PasscodeForm() {
  // const router = useRouter();
  const [disabled, setDisabled] = useState(false);
  const params = useSearchParams();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
    },
  });
  const email = params.get("email");
  assert(email, "expected email");

  const submit = useCallback(
    (token: string) => {
      setDisabled(true);
      const emailCallbackParams = new URLSearchParams({
        email,
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
    [setDisabled, params, email]
  );

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
                  autoFocus
                  disabled={disabled}
                  onPaste={handleOnPaste}
                  type="text"
                  placeholder="Enter your 5-digit token"
                  {...field}
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
        <Button disabled={disabled} type="submit">
          Submit
        </Button>
      </form>
    </Form>
  );
}

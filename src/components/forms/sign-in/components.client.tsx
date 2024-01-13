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
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [disabled, setDisabled] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      setDisabled(true);
      try {
        await signIn("email", {
          email: data.email,
          redirect: false,
        });

        const passcodeParams = new URLSearchParams({
          email: data.email,
        });

        const callbackUrl = params.get("callbackUrl");
        if (callbackUrl) {
          passcodeParams.set("callbackUrl", callbackUrl);
        }

        router.push(`/auth/passcode?${passcodeParams.toString()}`);
      } catch (error) {
        console.error("Sign in failed:", error);
        setDisabled(false);
      }
    },
    [router, params]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  autoComplete="email"
                  disabled={disabled}
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>Send yourself a login code.</FormDescription>
              {fieldState.error && (
                <FormMessage>{fieldState.error.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <Button disabled={disabled} type="submit" className="w-full" size="lg">
          {disabled ? "Loading..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}

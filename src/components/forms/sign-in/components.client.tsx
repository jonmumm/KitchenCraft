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
import { useCallback, useEffect, useState } from "react";

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
    (data: z.infer<typeof formSchema>) => {
      setDisabled(true);
      signIn("email", {
        email: data.email,
        redirect: false,
      }).then((res) => {
        const passcodeParams = new URLSearchParams({
          email: data.email,
        });

        const callbackUrl = params.get("callbackUrl");
        if (callbackUrl) {
          passcodeParams.set("callbackUrl", callbackUrl);
        }

        router.push(`/auth/passcode?${passcodeParams.toString()}`);
      });
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
              <FormDescription>
                Enter your email to send a login code.
              </FormDescription>
              {fieldState.error && (
                <FormMessage>{fieldState.error.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <Button disabled={disabled} type="submit" className="w-full" size="lg">
          Submit
        </Button>
      </form>
    </Form>
  );
}

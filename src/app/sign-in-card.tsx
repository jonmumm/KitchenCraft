"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
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
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { useSend } from "@/hooks/useSend";
import { XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export const SignInCard = () => {
  return (
    <Card>
      <CardHeader className="relative flex flex-row justify-between">
        <div>
          <CardTitle>Sign In</CardTitle>
          <CardDescription className="mt-2">
            Enter your email to receive a link.
          </CardDescription>
        </div>
        <div>
          <Button event={{ type: "CANCEL" }} variant="ghost" autoFocus={false}>
            <XIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  );
};

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

function SignInForm() {
  const [disabled, setDisabled] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  const send = useSend();
  useEffect(() => {
    return form.watch((data) => {
      const value = data.email || "";
      send({ type: "CHANGE", name: "email", value });
    }).unsubscribe;
  }, [send, form]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      setDisabled(true);
      send({ type: "SUBMIT" });
      // try {
      //   await signIn("email", {
      //     email: data.email,
      //     redirect: false,
      //   });

      //   const passcodeParams = new URLSearchParams({
      //     email: data.email,
      //   });

      //   const callbackUrl = params.get("callbackUrl");
      //   if (callbackUrl) {
      //     passcodeParams.set("callbackUrl", callbackUrl);
      //   }

      //   router.push(`/auth/passcode?${passcodeParams.toString()}`);
      // } catch (error) {
      //   console.error("Sign in failed:", error);
      //   setDisabled(false);
      // }
    },
    [send]
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

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import EventTrigger from "@/components/input/event-trigger";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import { EMAIL_INPUT_KEY } from "@/constants/inputs";
import { useAppMatchesState } from "@/hooks/useAppMatchesState";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSend } from "@/hooks/useSend";
import { useUserMatchesState } from "@/hooks/useUserMatchesState";
import { useUserMatchesStateHandler } from "@/hooks/useUserMatchesStateHandler";
import { selectUserEmail } from "@/selectors/page-session.selectors";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// export const IsSigningUp = userMatchesComponent({
//   Onboarding: "Email",
// });

export const IsSigningUp = ({ children }: { children: ReactNode }) => {
  const isSigningUpInOnboarding = useUserMatchesState({ Onboarding: "Email" });
  const isEmailSaved = useUserMatchesState({ Email: { Saved: "True" } });
  const isRegistering = useAppMatchesState({ SignUp: { Open: "True" } });
  // const isRegistering = useUserMatchesState({ Onboarding: "Email" });

  return !isEmailSaved && (isSigningUpInOnboarding || isRegistering) ? (
    <>{children}</>
  ) : (
    <></>
  );
};

export const SignUpCard = () => {
  return (
    <Card>
      <CardHeader className="relative flex flex-row justify-between">
        <div>
          <CardTitle>Save Your Recipes</CardTitle>
          <CardDescription className="mt-2">
            Create an account to keep track of what you create.
          </CardDescription>
        </div>
        <div>
          <Button event={{ type: "CANCEL" }} variant="ghost" autoFocus={false}>
            <XIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
    </Card>
  );
};

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

function SignUpForm() {
  const [disabled, setDisabled] = useState(false);
  //   const hasError = useSessionMatchesState({
  //     Auth: { SigningIn: { Inputting: "Error" } },
  //   });

  const isEmailAddressInUse = useUserMatchesState({
    Email: { Availability: "Unavailable" },
  });

  const store = usePageSessionStore();

  useUserMatchesStateHandler({ Email: { Saved: "True" } }, () => {
    setDisabled(false);
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: selectUserEmail(store.get()) || "",
    },
  });
  const send = useSend();
  useEffect(() => {
    return form.watch((data) => {
      setDisabled(false);
      const value = data.email || "";
      send({ type: "CHANGE", name: "email", value });
    }).unsubscribe;
  }, [send, form]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      setDisabled(true);
      //   send({ type: "CHANGE", name: EMAIL_INPUT_KEY, value: data.email });
      send({ type: "SUBMIT", name: EMAIL_INPUT_KEY });
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
                  //   disabled={isLoadingEmailResponse || isEmailInputComplete}
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              {fieldState.error && (
                <FormMessage>{fieldState.error.message}</FormMessage>
              )}{" "}
              {isEmailAddressInUse && (
                <FormMessage className="text-error">
                  Email is already in use.
                  {/* <EventTrigger event={{ type: "SIGN_IN" }} asChild>
                    <span className="underline text-primary font-semibold cursor-pointer">
                      Sign In
                    </span>
                  </EventTrigger> */}
                </FormMessage>
              )}
            </FormItem>
          )}
        />
        <Button disabled={disabled} type="submit" className="w-full" size="xl">
          Submit
        </Button>
      </form>
    </Form>
  );
}

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
import { Skeleton } from "@/components/display/skeleton";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import AnimatedText from "@/components/typography/animated-text";
import Delay from "@/components/util/delay";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useSend } from "@/hooks/useSend";
import { useSessionMatchesState } from "@/hooks/useSessionMatchesState";
import { selectSuggestedProfileNames } from "@/selectors/page-session.selectors";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const emailFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const profileNameFormSchema = z.object({
  profileName: z.string().min(3).max(20),
});

export default function Results() {
  const [isLoadingEmailResponse, setIsLoadingEmailResponse] = useState(false);
  const [isLoadingUsernameResponse, setIsLoadingUsernameResponse] =
    useState(false);

  const isEmailAddressInUse = useSessionMatchesState({
    Onboarding: { Summary: { Email: "InUse" } },
  });
  const isSendingWelcomeEmail = useSessionMatchesState({
    Onboarding: { Summary: { Email: "Sending" } },
  });
  const isWelcomeEmailSent = useSessionMatchesState({
    Onboarding: { Summary: { Email: "Sent" } },
  });

  const [isEmailInputComplete, setIsEmailInputComplete] = useState(false);
  const emailForm = useForm({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const profileNameForm = useForm({
    resolver: zodResolver(profileNameFormSchema),
    defaultValues: {
      username: "",
    },
  });
  const send = useSend();

  useEffect(() => {
    return emailForm.watch((data) => {
      const value = data.email || "";
      send({ type: "CHANGE", name: "email", value });
    }).unsubscribe;
  }, [send, emailForm]);

  const onSubmitEmail = useCallback(
    async (data: z.infer<typeof emailFormSchema>) => {
      send({ type: "SUBMIT" });
      // setIsLoadingEmailResponse(true);
      // try {
      //   // Three possible response
      //   // 1 -

      //   // Simulate API call
      //   console.log("Saving email:", data.email);
      //   setIsEmailInputComplete(true);

      //   setTimeout(() => {
      //     window.scrollTo({
      //       top: document.body.scrollHeight,
      //       behavior: "smooth",
      //     });
      //   }, 20);

      //   // Redirect to another page if needed
      // } catch (error) {
      //   console.error("Saving email failed:", error);
      // } finally {
      //   setIsLoadingEmailResponse(false);
      // }
    },
    [send]
  );

  const onSubmitUsername = useCallback(
    async (data: z.infer<typeof profileNameFormSchema>) => {
      console.log(data);
    },
    []
  );

  useEventHandler("SELECT_VALUE", (event) => {
    if (event.name === "suggested_profile_name") {
      profileNameForm.setValue("username", event.value);
    }
    return;
  });

  return (
    <div className="max-w-md mx-auto w-full px-4 flex flex-col gap-4">
      <div className="flex flex-col justify-center h-full md:mx-auto rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 w-full p-4">
        <h2 className="text-2xl font-semibold mb-2 leading-10">
          <AnimatedText
            text="Thank You"
            baseSpeed={60}
            punctDelay={600}
            delay={0}
          />
        </h2>
        <div className="text-lg mb-4 font-semibold leading-7">
          <AnimatedText
            text="For sharing your preferences"
            baseSpeed={50}
            punctDelay={300}
            delay={500}
          />
        </div>
        <div className="text-lg font-semibold leading-7 animate-pulse">
          <AnimatedText
            text="Your Chef Profile is building."
            baseSpeed={50}
            punctDelay={300}
            delay={2000}
          />
        </div>
      </div>
      <Delay delay={!isWelcomeEmailSent ? 3000 : 0}>
        <Card>
          <CardHeader>
            <CardTitle>
              {isSendingWelcomeEmail ? (
                <span className="animate-pulse">Sending Welcome Email...</span>
              ) : isWelcomeEmailSent ? (
                <>Email Sent!</>
              ) : (
                <>Save Recipes</>
              )}
            </CardTitle>
            <CardDescription>
              {isWelcomeEmailSent ? (
                <>
                  Click the link in your email later to finish confirming your
                  account.
                </>
              ) : isSendingWelcomeEmail ? (
                <>Confirmation email coming your way.</>
              ) : (
                <>
                  Provide an email to save your preferences, recipes, and lists.
                </>
              )}
            </CardDescription>
          </CardHeader>
          {!isSendingWelcomeEmail && !isWelcomeEmailSent && (
            <CardContent>
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(onSubmitEmail)}
                  className="space-y-8"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            autoFocus
                            autoComplete="email"
                            disabled={
                              isLoadingEmailResponse || isEmailInputComplete
                            }
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
                            Email is already in use.{" "}
                            <Link
                              className="text-foreground underline font-semibold"
                              href="/auth/signin"
                            >
                              Sign In
                            </Link>
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  {!isEmailInputComplete && (
                    <Button
                      disabled={isLoadingEmailResponse || isEmailAddressInUse}
                      type="submit"
                      className="w-full"
                      size="xl"
                    >
                      {isLoadingEmailResponse ? "Loading..." : "Submit"}
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          )}
        </Card>
      </Delay>
      {isWelcomeEmailSent && (
        <Delay delay={0}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Choose Profile Name</CardTitle>
              <CardDescription>
                Choose a profile name where you can access your recipes.
              </CardDescription>
              <div className="flex flex-row justify-between items-center">
                <Label className="uppercase text-xs text-muted-foreground">
                  Suggestions
                </Label>
                <Button variant="ghost" event={{ type: "REFRESH_SUGGESTIONS" }}>
                  <RefreshCwIcon size={14} />
                </Button>
              </div>
              <div className="flex flex-1 gap-1 flex-wrap">
                <ProfileNameSuggestions />
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileNameForm}>
                <form
                  onSubmit={profileNameForm.handleSubmit(onSubmitUsername)}
                  className="space-y-8"
                >
                  <FormField
                    control={profileNameForm.control}
                    name="username"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Profile Name</FormLabel>
                        <FormControl>
                          <Input
                            autoFocus
                            autoComplete="username"
                            disabled={
                              isLoadingEmailResponse || isEmailInputComplete
                            }
                            type="username"
                            placeholder="BakesaleBetty67"
                            {...field}
                          />
                        </FormControl>
                        {/* <FormDescription>
                          Send yourself a login code.
                        </FormDescription> */}
                        {fieldState.error && (
                          <FormMessage>{fieldState.error.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  <Button
                    disabled={
                      isLoadingUsernameResponse ||
                      isEmailInputComplete ||
                      isEmailAddressInUse
                    }
                    type="submit"
                    className="w-full"
                    size="xl"
                  >
                    {isLoadingUsernameResponse ? "Loading..." : "Submit"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </Delay>
      )}
    </div>
  );
}

const ProfileNameSuggestions = () => {
  const suggestedProfileNames = usePageSessionSelector(
    selectSuggestedProfileNames
  );
  const items = new Array(6).fill("");

  return (
    <>
      {items.map((item, index) => {
        return (
          <div key={index} className="carousel-item">
            {suggestedProfileNames.length > index ? (
              <Badge
                event={{
                  type: "SELECT_VALUE",
                  name: "suggested_profile_name",
                  value: suggestedProfileNames[index]!,
                }}
              >
                {suggestedProfileNames[index]}
              </Badge>
            ) : (
              <Badge>
                <Skeleton className="h-4 w-7" />
              </Badge>
            )}
          </div>
        );
      })}
    </>
  );
};

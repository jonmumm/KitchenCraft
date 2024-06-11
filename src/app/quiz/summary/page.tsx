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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import AnimatedText from "@/components/typography/animated-text";
import Delay from "@/components/util/delay";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSend } from "@/hooks/useSend";
import { useUserMatchesState } from "@/hooks/useUserMatchesState";
import {
  selectProfileName,
  selectSelectedFeedTopics,
  selectSuggestedFeedTopics,
  selectSuggestedProfileNames,
} from "@/selectors/page-session.selectors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@nanostores/react";
import { RefreshCwIcon } from "lucide-react";
import { atom } from "nanostores";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const emailFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const profileNameFormSchema = z.object({
  profileName: z.string().min(3).max(30),
});

export default function Results() {
  const [isLoadingEmailResponse, setIsLoadingEmailResponse] = useState(false);
  const [isLoadingUsernameResponse, setIsLoadingUsernameResponse] =
    useState(false);

  const isSelectingTopics = useUserMatchesState({
    Onboarding: { Summary: "Topics" },
  });
  const isEmailAddressInUse = useUserMatchesState({
    Email: { Availability: "Unavailable" },
  });
  const isSendingWelcomeEmail = useUserMatchesState({
    Email: { WelcomeEmail: "Sending" },
  });
  const isWelcomeEmailSent = useUserMatchesState({
    Email: { WelcomeEmail: "Sent" },
  });
  const isInputtingProfileName = useUserMatchesState({
    Onboarding: { Summary: "ProfileName" },
  });

  const [isEmailInputComplete, setIsEmailInputComplete] = useState(false);
  const emailForm = useForm({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });
  const isComplete = useUserMatchesState({
    Onboarding: "Complete",
  });

  const store = usePageSessionStore();

  const profileNameForm = useForm({
    resolver: zodResolver(profileNameFormSchema),
    defaultValues: {
      profileName: "",
    },
  });
  const send = useSend();

  useEffect(() => {
    return profileNameForm.watch((data) => {
      const value = data.profileName || "";
      send({ type: "CHANGE", name: "profileName", value });
    }).unsubscribe;
  }, [send, profileNameForm]);

  useEffect(() => {
    return emailForm.watch((data) => {
      const value = data.email || "";
      send({ type: "CHANGE", name: "email", value });
    }).unsubscribe;
  }, [send, emailForm]);

  const onSubmitEmail = useCallback(async () => {
    send({ type: "SUBMIT" });
  }, [send]);

  const onSubmitUsername = useCallback(async () => {
    send({ type: "SUBMIT" });
  }, [send]);

  useEventHandler("SELECT_VALUE", (event) => {
    if (event.name === "suggested_profile_name") {
      profileNameForm.setValue("profileName", event.value);
    }
    return;
  });

  return (
    <div className="max-w-md mx-auto w-full px-4 flex flex-col gap-4 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {isSelectingTopics ? "Select Topics" : "Selected Topics"}
          </CardTitle>
          <CardDescription>
            {isSelectingTopics ? (
              "This will help inform suggestions show in your daily cookbook."
            ) : (
              <>
                Thes topics will be used to help recommend you recipe. You can
                modify these preferences later.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSelectingTopics && <SuggestedFeedTopics />}
          {!isSelectingTopics && <SelectedFeedTopics />}
          {isSelectingTopics && <FeedTopicSubmitButton />}
        </CardContent>
      </Card>
      {!isSelectingTopics && (
        <>
          {!isComplete && (
            <Delay delay={0}>
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
            </Delay>
          )}
          <Delay delay={!isWelcomeEmailSent ? 3000 : 0}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {isSendingWelcomeEmail ? (
                    <span className="animate-pulse">
                      Sending Welcome Email...
                    </span>
                  ) : isWelcomeEmailSent ? (
                    <>Email Sent!</>
                  ) : (
                    <>Save Recipes</>
                  )}
                </CardTitle>
                <CardDescription>
                  {isWelcomeEmailSent ? (
                    <>
                      Click the link in your email later to finish confirming
                      your account.
                    </>
                  ) : isSendingWelcomeEmail ? (
                    <>Confirmation email coming your way.</>
                  ) : (
                    <>
                      Provide an email to save your preferences, recipes, and
                      lists.
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
                              <FormMessage>
                                {fieldState.error.message}
                              </FormMessage>
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
                          disabled={
                            isLoadingEmailResponse || isEmailAddressInUse
                          }
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
        </>
      )}
      {isInputtingProfileName && (
        <Delay delay={0}>
          <Card>
            <CardHeader>
              <CardTitle className="leading-8">
                {isComplete ? <>Profile Created!</> : <>Choose Profile Name</>}
              </CardTitle>
              <CardDescription>
                {isComplete ? (
                  <span>
                    You saved recipes will be available at:
                    <br /> kitchencraft.ai/@
                    <span className="font-semibold">
                      <ProfileNameSession />
                    </span>
                  </span>
                ) : (
                  <>Choose a profile name where you can access your recipes.</>
                )}
              </CardDescription>
              {!isComplete && (
                <>
                  <div className="flex flex-row justify-between items-center">
                    <Label className="uppercase text-xs text-muted-foreground">
                      Suggestions
                    </Label>
                    <Button variant="ghost" event={{ type: "LOAD_MORE" }}>
                      <RefreshCwIcon size={14} />
                    </Button>
                  </div>
                  <div className="flex flex-1 gap-1 flex-wrap">
                    <ProfileNameSuggestions />
                  </div>
                </>
              )}
            </CardHeader>
            {!isComplete && (
              <CardContent>
                <Form {...profileNameForm}>
                  <form
                    onSubmit={profileNameForm.handleSubmit(onSubmitUsername)}
                    className="space-y-8"
                  >
                    <FormField
                      control={profileNameForm.control}
                      name="profileName"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Profile Name</FormLabel>
                          <FormControl>
                            <Input
                              autoFocus
                              autoComplete="profile"
                              disabled={
                                isLoadingEmailResponse || isEmailInputComplete
                              }
                              type="text"
                              placeholder="BakesaleBetty67"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            You recipes will be saved to:
                            <br /> kitchencraft.ai/@
                            <ProfileNameForm />
                          </FormDescription>
                          {fieldState.error && (
                            <FormMessage>
                              {fieldState.error.message}
                            </FormMessage>
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
            )}
          </Card>
        </Delay>
      )}
      {isComplete && (
        <Delay delay={0}>
          <div className="flex flex-col justify-center md:mx-auto rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 w-full p-4">
            <h2 className="text-2xl font-semibold leading-8 text-white">
              <AnimatedText
                text={`Hello ${selectProfileName(store.get())}`}
                baseSpeed={50}
                punctDelay={300}
                delay={500}
              />
            </h2>

            <Delay delay={1000}>
              <AnimatedChefProfile />
            </Delay>
          </div>
        </Delay>
      )}
    </div>
  );
}

const FeedTopicSubmitButton = () => {
  const selection = useStore(selected$);
  const count = Object.keys(selection).length;
  return (
    <Button
      className="w-full mt-6"
      size="xl"
      event={{ type: "SUBMIT" }}
      disabled={count < 3}
    >
      {count >= 3 ? <>Submit</> : <>Pick at 3 or more</>}
    </Button>
  );
};

const AnimatedChefProfile = () => {
  const router = useRouter();
  const send = useSend();
  useEffect(() => {
    send({ type: "REFRESH_FEED" });
    const timer = setTimeout(() => {
      router.push("/");
    }, 3750);

    return () => {
      clearTimeout(timer);
    };
  }, [router, send]);

  return (
    <>
      <p className="text-lg font-semibold">
        <AnimatedText
          text={`Welcome to KitchenCraft...`}
          baseSpeed={50}
          punctDelay={300}
          delay={500}
        />
      </p>
      <p className="text-lg font-semibold">
        <AnimatedText
          text={`Preparing Today's Cookbook...`}
          baseSpeed={50}
          punctDelay={300}
          delay={1500}
        />
      </p>
      <Delay delay={2250}>
        <div>
          <p className="text-lg font-semibold animate-pulse">
            <AnimatedText
              text={`Launching...`}
              baseSpeed={50}
              punctDelay={300}
              delay={1500}
            />
          </p>
        </div>
      </Delay>
    </>
  );
};

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

const ProfileNameSession = () => {
  const profileName = usePageSessionSelector(selectProfileName);

  return (
    <>{!profileName || profileName === "" ? "PROFILE-NAME" : profileName}</>
  );
};

const ProfileNameForm = () => {
  const profileName = useWatch({ name: "profileName" });

  return (
    <span className="font-semibold">
      {profileName === "" ? "PROFILE-NAME" : profileName}
    </span>
  );
};

const SelectedFeedTopics = () => {
  const selectedFeedTopics = usePageSessionSelector(selectSelectedFeedTopics);

  const Item = ({ index }: { index: number }) => {
    const topic = selectedFeedTopics && selectedFeedTopics[index];

    return <Badge variant={"default"}>{topic}</Badge>;
  };

  return selectedFeedTopics ? (
    <div className="flex flex-row gap-2 flex-wrap">
      {selectedFeedTopics.map((item, index) => {
        return <Item key={item} index={index} />;
      })}
    </div>
  ) : (
    <></>
  );
};

const selected$ = atom<Record<string, boolean>>({});

const SuggestedFeedTopics = () => {
  const suggestedFeedTopics = usePageSessionSelector(selectSuggestedFeedTopics);
  const items = new Array(20).fill(0);

  // todo fix bug here around initial selections not being shown as selected
  const Item = ({
    index,
    initialValue: boolean,
  }: {
    index: number;
    initialValue: boolean;
  }) => {
    const topic = suggestedFeedTopics && suggestedFeedTopics[index];
    const selections = useStore(selected$);
    const isSelected = !!topic && selections[topic];
    useEventHandler("SELECT_TOPIC", (event) => {
      if (event.topic === topic) {
        const selected = selected$.get();
        selected$.set({
          ...selected,
          [topic]: !selected[topic],
        });
      }
    });

    return topic ? (
      <Badge
        event={{ type: "SELECT_TOPIC", topic }}
        variant={!isSelected ? "outline" : "default"}
      >
        {topic}
      </Badge>
    ) : (
      <Skeleton className="w-10 h-4" />
    );
  };

  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {items.map((item, index) => {
        return (
          <Item
            key={index}
            index={index}
            initialValue={!!selected$.get()[item]}
          />
        );
      })}
    </div>
  );
};

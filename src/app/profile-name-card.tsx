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
import { userMatchesComponent } from "@/components/util/user-matches";
import { PROFILE_NAME_INPUT_KEY } from "@/constants/inputs";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useSend } from "@/hooks/useSend";
import {
    selectProfileName,
    selectSuggestedProfileNames,
} from "@/selectors/page-session.selectors";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

export const IsSettingProfileName = userMatchesComponent({
  Onboarding: "ProfileName",
});

const profileNameFormSchema = z.object({
  [PROFILE_NAME_INPUT_KEY]: z.string().min(3).max(30),
});

export const ProfileNameCard = () => {
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const profileNameForm = useForm({
    resolver: zodResolver(profileNameFormSchema),
    defaultValues: {
      [PROFILE_NAME_INPUT_KEY]: "",
    },
  });
  const send = useSend();
  useEffect(() => {
    return profileNameForm.watch((data) => {
      const value = data.profileName || "";
      send({ type: "CHANGE", name: PROFILE_NAME_INPUT_KEY, value });
    }).unsubscribe;
  }, [send, profileNameForm]);

  const onSubmit = useCallback(async () => {
    send({ type: "SUBMIT", name: PROFILE_NAME_INPUT_KEY });
  }, [send]);

  return (
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
              onSubmit={profileNameForm.handleSubmit(onSubmit)}
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
                        autoCapitalize="none"
                        autoComplete="profile"
                        // disabled={
                        //   isLoadingEmailResponse || isEmailInputComplete
                        // }
                        type="text"
                        placeholder="(e.g. BakesaleBetty67)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      You recipes will be saved to:
                      <br /> kitchencraft.ai/@
                      <ProfileNameForm />
                    </FormDescription>
                    {fieldState.error && (
                      <FormMessage>{fieldState.error.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              <Button
                disabled={isLoading}
                // disabled={
                //   isLoadingUsernameResponse ||
                //   isEmailInputComplete ||
                //   isEmailAddressInUse
                // }
                type="submit"
                className="w-full"
                size="xl"
              >
                {isLoading ? "Loading..." : "Submit"}
              </Button>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  );
};

const ProfileNameSession = () => {
  const profileName = usePageSessionSelector(selectProfileName);

  return (
    <>{!profileName || profileName === "" ? "PROFILE-NAME" : profileName}</>
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

const ProfileNameForm = () => {
  const profileName = useWatch({ name: PROFILE_NAME_INPUT_KEY });

  return (
    <span className="font-semibold">
      {profileName === "" ? "PROFILE-NAME" : profileName}
    </span>
  );
};

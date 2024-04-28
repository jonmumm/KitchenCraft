"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/display/accordion";
import { Badge } from "@/components/display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Progress } from "@/components/feedback/progress";
import { Button } from "@/components/input/button";
import { Textarea } from "@/components/input/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageSessionSnapshotConditionalRenderer } from "@/components/util/page-session-snapshot-conditiona.renderer";
import { useCraftIsOpen, usePromptIsDirty } from "@/hooks/useCraftIsOpen";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { useSessionStore } from "@/hooks/useSessionStore";
import { UserPreferenceType } from "@/types";
import { RefreshCwIcon, XIcon } from "lucide-react";
import { Inter } from "next/font/google";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ComponentProps,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { twc } from "react-twc";
import { toast } from "sonner";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import {
  EnterChefNameForm,
  EnterEmailForm,
  EnterListNameForm,
} from "./@craft/components.client";
import { CraftContext } from "./context";
import { EQUIPMENT_ITEMS, MISC_ONBORADING_QUESTIONS } from "./data";
import { CraftSnapshot } from "./machine";
import { SessionSnapshot } from "./page-session-store";

const inter = Inter({ subsets: ["latin"] });

export const Body = ({
  children,
  isPWA,
}: {
  children: ReactNode;
  isPWA: boolean;
}) => {
  const craftIsOpen = useCraftIsOpen();
  const promptIsDirty = usePromptIsDirty();

  return (
    <body
      className={`${inter.className} overflow-x-hidden ${
        craftIsOpen ? `crafting` : ``
      }
      ${promptIsDirty ? `prompt-dirty` : ``}

      ${isPWA ? `pwa` : ``}
      `}
      suppressHydrationWarning
    >
      {children}
    </body>
  );
};

export const SearchParamsToastMessage = () => {
  const consumedParamsMapRef = useRef(new Map());
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPathnameRef = useRef(pathname);

  useEffect(() => {
    if (currentPathnameRef.current !== pathname) {
      consumedParamsMapRef.current.clear();
      currentPathnameRef.current = pathname;
    }
  }, [pathname, currentPathnameRef]);

  useEffect(() => {
    if (!consumedParamsMapRef.current.get("message")) {
      consumedParamsMapRef.current.set("message", true);
      const message = searchParams.get("message");
      if (message) {
        toast(message);
      }
    }
  }, [searchParams, consumedParamsMapRef]);

  return <></>;
};

export const EnterChefNameCard = () => {
  const ChefNameSuggestions = () => {
    const suggestedChefNames = useSuggestedChefnames();
    const items = new Array(6).fill("");

    return (
      <>
        {items.map((item, index) => {
          return (
            <div key={index} className="carousel-item">
              {suggestedChefNames.length > index ? (
                <Badge
                  event={{
                    type: "SELECT_VALUE",
                    name: "suggested_chefname",
                    value: suggestedChefNames[index]!,
                  }}
                >
                  {suggestedChefNames[index]}
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row gap-1 items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Your Chef Name</CardTitle>
            <CardDescription>
              Choose a name so you and others can quickly access your saved
              recipes. Must be unique.
            </CardDescription>
            <div className="flex flex-row justify-between items-center">
              <Label className="uppercase text-xs text-muted-foreground">
                Suggestions
              </Label>
              <Button variant="ghost" event={{ type: "REFRESH" }}>
                <RefreshCwIcon size={14} />
              </Button>
            </div>
            <div className="flex flex-1 gap-1 flex-wrap">
              <ChefNameSuggestions />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EnterChefNameForm />
      </CardContent>
    </Card>
  );
};

const OnboardingMiscQuestion = () => {
  return (
    <div className="py-2">
      <div className="flex flex-col gap-4 justify-between items-center px-2">
        <QuestionHeader>Which of these apply to you?</QuestionHeader>
        <div className="flex flex-col gap-2 w-full">
          {MISC_ONBORADING_QUESTIONS.map((item) => {
            return (
              <div
                key={item.id}
                className="w-full flex items-center justify-between"
              >
                <QuestionSubQuestion>{item.question}</QuestionSubQuestion>
                <div className="flex items-stretch flex-row gap-2">
                  <ToggleGroup type="single">
                    <ToggleGroupItem value={"no"}>No</ToggleGroupItem>
                    <ToggleGroupItem value={"yes"}>Yes</ToggleGroupItem>
                  </ToggleGroup>
                  {/* <Button
                    variant="outline"
                    event={{
                      type: "SELECT_VALUE",
                      name: `onboarding:misc:${item.id}`,
                      value: "no",
                    }}
                  >
                    No
                  </Button>
                  <Button
                    variant="outline"
                    event={{
                      type: "SELECT_VALUE",
                      name: `onboarding:misc:${item.id}`,
                      value: "yes",
                    }}
                  >
                    Yes
                  </Button> */}
                </div>
              </div>
            );
          })}
        </div>
        <Button className="w-full" size="lg" event={{ type: "NEXT" }}>
          Next
        </Button>
      </div>
    </div>
  );
};

const OnboardingExclusionsQuestion = () => {
  const send = useSend();
  const [empty, setEmpty] = useState(true);

  return (
    <QuestionContainer>
      <Progress value={40} />
      <QuestionHeader>
        Do you have any dietary restrictions or ingredients you would like to
        exclude from recipes?
      </QuestionHeader>
      <QuestionTextarea
        autoFocus
        placeholder="(e.g. nut allergies, no eggs, no dairy, vegan, gluten-free, keto)"
        onChange={(event) => {
          send({
            type: "CHANGE",
            name: "onboarding:exclusions",
            value: event.currentTarget.value,
          });
          event.currentTarget.value.length ? setEmpty(false) : setEmpty(true);
        }}
      />
      <Button
        event={{
          type: "NEXT",
        }}
      >
        {empty ? <>No, Skip</> : <>Next</>}
      </Button>
    </QuestionContainer>
  );
  // return (
  //   <div className="py-2">
  //     <div className="flex flex-row gap-2 justify-between items-center px-2">
  //       <h2 className="text-lg font-bold">Exclusions</h2>
  //       <Button variant="outline" event={{ type: "CLOSE" }}>
  //         <XIcon />
  //       </Button>
  //     </div>
  //     <Button event={{ type: "NEXT" }} />
  //   </div>
  // );
};

const OnboardingComplete = () => {
  return (
    <div className="py-2">
      <div className="flex flex-row gap-2 justify-between items-center px-2">
        <h2 className="text-lg font-bold">Complete</h2>
        <Button variant="outline" event={{ type: "CLOSE" }}>
          <XIcon />
        </Button>
      </div>
    </div>
  );
};

const OnboardingIngredientsQuestion = () => {
  const send = useSend();
  const [empty, setEmpty] = useState(true);

  return (
    <QuestionContainer>
      <QuestionHeader>
        Now, what ingredients would you like to use? Let&apos;s come up with
        some recipe ideas!
      </QuestionHeader>
      <QuestionTextarea
        autoFocus
        placeholder="(e.g., chicken, avocado, quinoa)"
        onChange={(event) => {
          send({
            type: "CHANGE",
            name: "onboarding:preferred_ingredients",
            value: event.currentTarget.value,
          });
          event.currentTarget.value.length ? setEmpty(false) : setEmpty(true);
        }}
      />
      <Button
        disabled={empty}
        event={{
          type: "NEXT",
        }}
      >
        Get Personalized Recipes
      </Button>
    </QuestionContainer>
  );
};

const OnboardingEquipmentQuestion = () => {
  return (
    <div className="py-2">
      <div className="flex flex-col gap-4 justify-between items-center px-2">
        <QuestionHeader>Do you have any of these?</QuestionHeader>
        <div className="flex flex-col gap-2 w-full">
          {EQUIPMENT_ITEMS.map((item) => (
            <div
              key={item.id}
              className="w-full flex items-center justify-between"
            >
              <QuestionSubQuestion>{item.equipment}</QuestionSubQuestion>
              <div className="flex items-stretch flex-row gap-2">
                <ToggleGroup type="single">
                  <ToggleGroupItem value={"no"}>No</ToggleGroupItem>
                  <ToggleGroupItem value={"yes"}>Yes</ToggleGroupItem>
                </ToggleGroup>
                {/* <Button
                  variant="outline"
                  event={{
                    type: "SELECT_VALUE",
                    name: `onboarding:equipment:${item.id}`,
                    value: "no",
                  }}
                >
                  No
                </Button>
                <Button
                  variant="outline"
                  event={{
                    type: "SELECT_VALUE",
                    name: `onboarding:equipment:${item.id}`,
                    value: "yes",
                  }}
                >
                  Yes
                </Button> */}
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full" size="lg" event={{ type: "NEXT" }}>
          Next
        </Button>
      </div>
    </div>
  );
};

const QuestionContainer = twc.div`px-2 flex flex-col gap-2 py-2`;
const QuestionHeader = twc.h2`text-lg font-bold`;
const QuestionSubQuestion = twc.h3`text-md font-semibold`;
const QuestionExamples = twc.div`text-sm text-muted-foreground`;

const OnboardingMealTypeQuestion = () => {
  return (
    <QuestionContainer>
      <Progress value={20} />
      <QuestionHeader>
        What kind of recipe would you like to make?
      </QuestionHeader>
      <Button
        variant="outline"
        event={{
          type: "SELECT_VALUE",
          name: "onboarding:meal_type",
          value: "Breakfast",
        }}
      >
        Breakfast
      </Button>
      <Button
        variant="outline"
        event={{
          type: "SELECT_VALUE",
          name: "onboarding:meal_type",
          value: "Lunch",
        }}
      >
        Lunch
      </Button>
      <Button
        variant="outline"
        event={{
          type: "SELECT_VALUE",
          name: "onboarding:meal_type",
          value: "Lunch",
        }}
      >
        Dinner
      </Button>
      <Button
        variant="outline"
        event={{
          type: "SELECT_VALUE",
          name: "onboarding:meal_type",
          value: "Snack",
        }}
      >
        Snack
      </Button>
      <Button
        variant="outline"
        event={{
          type: "SELECT_VALUE",
          name: "onboarding:meal_type",
          value: "Appetizer",
        }}
      >
        Appetizer
      </Button>
      <Button
        variant="outline"
        event={{
          type: "SELECT_VALUE",
          name: "onboarding:meal_type",
          value: "Side",
        }}
      >
        Side
      </Button>
      <Button
        variant="outline"
        event={{
          type: "SELECT_VALUE",
          name: "onboarding:meal_type",
          value: "Dessert",
        }}
      >
        Dessert
      </Button>
    </QuestionContainer>
  );
};

const QuestionTextarea = (props: ComponentProps<typeof Textarea>) => {
  return <Textarea className="text-lg my-2" {...props} />;
};

// export const OnboardingFlow = () => {
//   return (
//     <>
//       <PageSessionSnapshotConditionalRenderer
//         selector={selectIsInOnboardingMealType}
//       >
//         <OnboardingMealTypeQuestion />
//       </PageSessionSnapshotConditionalRenderer>
//       <PageSessionSnapshotConditionalRenderer
//         selector={selectIsInOnboardingExclusions}
//       >
//         <OnboardingExclusionsQuestion />
//       </PageSessionSnapshotConditionalRenderer>
//       <PageSessionSnapshotConditionalRenderer
//         selector={selectIsInOnboardingMisc}
//       >
//         <OnboardingMiscQuestion />
//       </PageSessionSnapshotConditionalRenderer>
//       <PageSessionSnapshotConditionalRenderer
//         selector={selectIsInOnboardingEquipment}
//       >
//         <OnboardingEquipmentQuestion />
//       </PageSessionSnapshotConditionalRenderer>
//       <PageSessionSnapshotConditionalRenderer
//         selector={selectIsInOnboardingIngredients}
//       >
//         <OnboardingIngredientsQuestion />
//       </PageSessionSnapshotConditionalRenderer>
//       <PageSessionSnapshotConditionalRenderer
//         selector={selectIsInOnboardingComplete}
//       >
//         <OnboardingComplete />
//       </PageSessionSnapshotConditionalRenderer>
//     </>
//   );
// };

export const PersonalizationSettingsMenu = () => {
  const send = useSend();
  return (
    <div className="py-2">
      <div className="flex flex-row gap-2 justify-between items-center px-2">
        <h2 className="text-lg font-bold">Preferences</h2>
        <Button variant="outline" event={{ type: "CLOSE" }}>
          <XIcon />
        </Button>
      </div>
      <Accordion type="multiple" className="flex flex-col gap-2">
        <AccordionItem value="ingredient_preference" className="py-4">
          <AccordionTrigger className="px-4">
            What ingredients do you like to cook with?
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <PreferenceEditor
              placeholder="e.g., Chicken, Tomatoes, Basil, Tofu"
              preference="ingredientPreference"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cuisine_preferences" className="py-4">
          <AccordionTrigger className="px-4">
            What are your favorite cuisines or flavors?
          </AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-2">
            <PreferenceEditor
              placeholder="e.g., Italian, Mexican, Thai, Vegetarian, etc."
              preference="cuisinePreferences"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dietary_restrictions" className="py-4">
          <AccordionTrigger className="px-4">
            Do you have any dietary restrictions or preferences?
          </AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-2">
            <PreferenceEditor
              placeholder="e.g., Gluten-free, Dairy-free, Vegan, Low-carb, etc."
              preference="dietaryRestrictions"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skill" className="py-4">
          <AccordionTrigger className="px-4">
            What is your skill level in the kitchen?
          </AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-2">
            <PreferenceEditor
              placeholder="e.g., Beginner, Intermediate, Advanced, Expert"
              preference="skillLevel"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="time_availability" className="py-4">
          <AccordionTrigger className="px-4">
            How much time do you typically spend on preparing a meal?
          </AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-2">
            <PreferenceEditor
              placeholder="e.g., Under 30 minutes, About an hour, More than 2 hours"
              preference="timeAvailability"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cookingEquipment" className="py-4">
          <AccordionTrigger className="px-4">
            Are there any particular kitchen tools you love using?
          </AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-2">
            <PreferenceEditor
              placeholder="e.g., Blender, Chef's knife, Stand mixer, Pressure cooker"
              preference="cookingEquipment"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const selectIsInOnboarding = (snapshot: SessionSnapshot) => {
  const state = snapshot.value;
  return (
    typeof state.Auth === "object" &&
    typeof state.Auth.Anonymous === "object" &&
    state.Auth.Anonymous.Onboarding === "Open"
  );
};

// const selectIsInOnboardingMealType = (snapshot: SessionSnapshot) => {
//   const session = snapshot.context.browserSessionSnapshot;
//   if (!session) {
//     return false;
//   }

//   return session.value.Onboarding === "MealType";
// };

// const selectIsInOnboardingExclusions = (snapshot: SessionSnapshot) => {
//   const session = snapshot.context.browserSessionSnapshot;
//   if (!session) {
//     return false;
//   }

//   return session.value.Onboarding === "Exclusions";
// };

const selectIsInOnboardingEquipment = (snapshot: SessionSnapshot) => {
  const session = snapshot.context.browserSessionSnapshot;
  if (!session) {
    return false;
  }

  return session.value.Onboarding === "Equipment";
};

// const selectIsInOnboardingMisc = (snapshot: SessionSnapshot) => {
//   const session = snapshot.context.browserSessionSnapshot;
//   if (!session) {
//     return false;
//   }

//   return session.value.Onboarding === "Misc";
// };

const selectIsInOnboardingComplete = (snapshot: SessionSnapshot) => {
  const session = snapshot.context.browserSessionSnapshot;
  if (!session) {
    return false;
  }

  return session.value.Onboarding === "Complete";
};

// const selectIsInOnboardingIngredients = (snapshot: SessionSnapshot) => {
//   const session = snapshot.context.browserSessionSnapshot;
//   if (!session) {
//     return false;
//   }

//   return session.value.Onboarding === "Ingredients";
// };

const selectIsUserPreferencesInitialized = (snapshot: SessionSnapshot) => {
  const state = snapshot.value;
  return (
    state.UserPreferences !== "Uninitialized" &&
    state.UserPreferences !== "Initializing"
  );
};

export const IsInOnboarding = ({ children }: { children: ReactNode }) => {
  return (
    <PageSessionSnapshotConditionalRenderer
      selector={selectIsInOnboarding}
      initialValueOverride={false}
    >
      {children}
    </PageSessionSnapshotConditionalRenderer>
  );
};

const IsUserPreferencesInitialized = ({
  children,
}: {
  children: ReactNode;
}) => {
  const session$ = useSessionStore();
  const active = useSyncExternalStore(
    session$.subscribe,
    () => selectIsUserPreferencesInitialized(session$.get()),
    () => selectIsUserPreferencesInitialized(session$.get())
  );

  return active ? <>{children}</> : <></>;
};

const selectIsUserPreferencesInitializing = (snapshot: SessionSnapshot) => {
  return !selectIsUserPreferencesInitialized(snapshot);
};

const IsInitializingUserPreferences = ({
  children,
}: {
  children: ReactNode;
}) => {
  const session$ = useSessionStore();
  const active = useSyncExternalStore(
    session$.subscribe,
    () => selectIsUserPreferencesInitializing(session$.get()),
    () => selectIsUserPreferencesInitializing(session$.get())
  );

  return active ? <>{children}</> : <></>;
};

const PreferenceEditor = ({
  preference,
  ...props
}: { preference: UserPreferenceType } & ComponentProps<typeof Textarea>) => {
  const send = useSend();
  const session$ = useSessionStore();

  const PreferenceTextArea = () => {
    const [value, setValue] = useState(
      session$.get().context.userPreferences[preference] || ""
    );

    return (
      <Textarea
        value={value}
        className="text-lg my-2"
        onChange={(event) => {
          setValue(event.currentTarget.value);
          send({
            type: "UPDATE_USER_PREFERENCE",
            key: preference,
            value: [event.currentTarget.value],
          });
        }}
        {...props}
      />
    );
  };

  return (
    <>
      <IsInitializingUserPreferences>
        <Skeleton className="w-full h-20 animate-pulse" />
      </IsInitializingUserPreferences>
      <IsUserPreferencesInitialized>
        <PreferenceTextArea />
      </IsUserPreferencesInitialized>
    </>
  );
};

export const EnterEmailCard = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row gap-1 items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Save Your Recipe</CardTitle>
            <CardDescription>
              Enter your email to save your recipe.
            </CardDescription>
          </div>
          <div className="">
            <Button event={{ type: "CANCEL" }}>
              <XIcon />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EnterEmailForm />
      </CardContent>
    </Card>
  );
};

export const IsInPersonalizationSettings = (props: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const active = useSelector(actor, (state) =>
    state.matches({ PersonalizationSettings: "Open" })
  );

  return active ? <>{props.children}</> : null;
};

export const IsInputtingChefName = (props: { children: ReactNode }) => {
  const session$ = useSessionStore();

  const selector = useCallback(() => {
    const stateValue = session$.get().value;
    return (
      typeof stateValue.Auth === "object" &&
      typeof stateValue.Auth.Registering === "object" &&
      !!stateValue.Auth.Registering.InputtingChefName
    );
  }, []);

  const active = useSyncExternalStore(session$.subscribe, selector, selector);
  return active ? <>{props.children}</> : null;
};

const selectIsCreatingList = (state: CraftSnapshot) =>
  state.matches({
    Auth: { LoggedIn: { Adding: { True: { ListCreating: "True" } } } },
  });

const selectIsSelectingList = (state: CraftSnapshot) =>
  state.matches({ Auth: { LoggedIn: { Adding: "True" } } }) &&
  !selectIsCreatingList(state);

export const IsSelectingList = (props: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const active = useSelector(actor, selectIsSelectingList);
  return active ? <>{props.children}</> : null;
};

export const IsCreatingList = (props: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const active = useSelector(actor, selectIsCreatingList);

  return active ? <>{props.children}</> : null;
};

export const IsInputtingEmail = (props: { children: ReactNode }) => {
  const session$ = useSessionStore();
  const selector = useCallback(() => {
    const stateValue = session$.get().value;
    const val =
      typeof stateValue.Auth === "object" &&
      typeof stateValue.Auth.Registering === "object" &&
      !!stateValue.Auth.Registering.InputtingEmail;
    return val;
  }, []);

  const active = useSyncExternalStore(session$.subscribe, selector, selector);

  return active ? <>{props.children}</> : null;
};

const useIsLoadingRecipeLists = () => {
  const session$ = useSessionStore();

  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().value;
    },
    () => {
      return session$.get().value;
    },
    (value) =>
      typeof value.Craft === "object" &&
      typeof value.Craft.Adding === "object" &&
      typeof value.Craft.Adding.True === "object" &&
      value.Craft.Adding.True.Lists === "Fetching"
  );
};

const useSortedRecipeLists = () => {
  const session$ = useSessionStore();

  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context.listsBySlug;
    },
    () => {
      return session$.get().context.listsBySlug;
    },
    (listsBySlug) =>
      listsBySlug
        ? Object.values(listsBySlug)
            .filter(({ slug }) => slug !== "my-cookbook")
            .toSorted((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        : []
  );
};

const useSuggestedListNames = () => {
  const session$ = useSessionStore();

  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => context.suggestedListNames
  );
};

const useSuggestedChefnames = () => {
  const session$ = useSessionStore();

  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => {
      return session$.get().context;
    },
    () => {
      return session$.get().context;
    },
    (context) => context.suggestedChefnames
  );
};

export const SelectListCard = () => {
  const SuggestedLists = () => {
    const suggestedListNames = useSuggestedListNames();
    const items = new Array(6).fill("");

    return (
      <div className="carousel carousel-center max-w-[100vw] space-x-2 pl-2 pr-4">
        {items.map((item, index) => {
          const name = suggestedListNames[index];

          return (
            <Card
              key={index}
              className="p-4 flex gap-1 items-center justify-between cursor-pointer carousel-item w-72"
              event={{ type: "SELECT_LIST", listSlug: "my-cookbook" }}
            >
              <div className="grid gap-1">
                <h4 className="font-semibold">
                  {name ? (
                    <>✨ {name}</>
                  ) : (
                    <SkeletonSentence className="h-6" numWords={2} />
                  )}
                </h4>
              </div>
              {name ? (
                <Button size="sm" variant="outline">
                  Create
                </Button>
              ) : (
                <Button size="sm" variant="outline">
                  <Skeleton className="h-4 w-10" />
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const RecentLists = () => {
    const lists = useSortedRecipeLists();
    console.log({ lists });
    const isLoading = useIsLoadingRecipeLists();
    const items = new Array(6).fill("");

    return (
      <div className="flex flex-col gap-2 px-4">
        {items.map((item, index) => {
          const name = lists[index]?.name;
          const count = lists[index]?.recipeCount;
          const createdAt = lists[index]?.createdAt;
          const listSlug = lists[index]?.slug;
          return (
            <Card
              key={index}
              className="p-4 flex gap-1 items-center justify-between cursor-pointer"
              event={listSlug ? { type: "SELECT_LIST", listSlug } : undefined}
            >
              <div className="grid gap-1">
                <h4 className="font-semibold">
                  {name ? (
                    <>{name}</>
                  ) : isLoading ? (
                    <SkeletonSentence className="h-6" numWords={2} />
                  ) : (
                    <span className="text-muted-foreground">Empty</span>
                  )}
                </h4>
                {count && createdAt ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      {count} recipe{count > 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Created {formatCreateTime(createdAt)}
                    </span>
                  </div>
                ) : isLoading ? (
                  <SkeletonSentence
                    className="h-4 text-gray-500 dark:text-gray-400"
                    numWords={3}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Press to create
                  </span>
                )}
              </div>
              {listSlug ? (
                <Button size="sm" event={{ type: "SELECT_LIST", listSlug }}>
                  Select
                </Button>
              ) : isLoading ? (
                <Button size="sm" variant="outline">
                  <Skeleton className="h-4 w-10" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  event={{ type: "CREATE_LIST" }}
                >
                  New
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="overflow-y-auto max-h-[95svh] py-4">
      <div className="flex flex-row gap-1 items-center justify-between px-4">
        <div className="flex flex-col gap-1 mb-2">
          <CardTitle>Add to List</CardTitle>
          <CardDescription>
            Select a list to add this recipe to.
          </CardDescription>
          {/* <div className="flex flex-row justify-between items-center">
              <Label className="uppercase text-xs text-muted-foreground">
                Recent
              </Label>
              <Button variant="ghost" event={{ type: "REFRESH" }}>
                <RefreshCwIcon size={14} />
              </Button>
            </div> */}
          {/* <div className="flex flex-1 gap-1 flex-wrap">
            </div> */}
        </div>
        <Button variant="outline" size="icon" event={{ type: "CANCEL" }}>
          <XIcon />
        </Button>
      </div>
      <div className="px-4 flex flex-col gap-2">
        <Button
          size="fit"
          className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md h-24 text-gray-500 dark:text-gray-400"
          event={{ type: "CREATE_LIST" }}
        >
          + Create List
        </Button>
        <MyCookbookCard />
      </div>
      <div className="mt-4">
        <Label className="uppercase text-xs text-muted-foreground mx-4">
          Recent
        </Label>
        <div>
          <RecentLists />
        </div>
      </div>
      {/* <div className="mt-4">
        <Label className="uppercase text-xs text-muted-foreground mx-4">
          Suggestions
        </Label>
        <div>
          <SuggestedLists />
        </div>
      </div> */}
    </div>
  );
};

export const CreateNewListCard = () => {
  const ListNameSuggestions = () => {
    const suggestedListNames = useSuggestedListNames();
    const items = new Array(6).fill("");

    return (
      <>
        {items.map((item, index) => {
          return (
            <div key={index} className="carousel-item">
              {suggestedListNames.length > index ? (
                <Badge
                  event={{
                    type: "SELECT_VALUE",
                    name: "suggested_listname",
                    value: suggestedListNames[index]!,
                  }}
                >
                  {suggestedListNames[index]}
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

  return (
    <Card className="py-4">
      <div className="flex flex-row gap-1 items-center justify-between px-4">
        <div className="flex flex-col gap-1 mb-2">
          <CardTitle>New Recipe List</CardTitle>
          <CardDescription>Enter a name for your new list.</CardDescription>
          {/* <div className="flex flex-row justify-between items-center">
              <Label className="uppercase text-xs text-muted-foreground">
                Recent
              </Label>
              <Button variant="ghost" event={{ type: "REFRESH" }}>
                <RefreshCwIcon size={14} />
              </Button>
            </div> */}
          {/* <div className="flex flex-1 gap-1 flex-wrap">
            </div> */}
        </div>
        <Button variant="outline" size="icon" event={{ type: "CANCEL" }}>
          <XIcon />
        </Button>
      </div>
      <CardContent>
        <EnterListNameForm />
      </CardContent>
    </Card>
  );
};

const MyCookbookCard = () => {
  return (
    <Card
      className="p-4 flex items-center justify-between cursor-pointer"
      event={{ type: "SELECT_LIST", listSlug: "my-cookbook" }}
    >
      <div className="grid gap-2">
        <h4 className="font-semibold">My Cookbook</h4>
        <p className="text-xs text-muted-foreground">
          Your personal collection of recipes.
        </p>
      </div>
      <Button size="sm">Select</Button>
    </Card>
  );
};

function formatCreateTime(createdAt: Date | string | number): string {
  const date = new Date(createdAt);
  const now = new Date();
  const secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000);

  // If the date is within the last 7 days, return relative time
  if (secondsAgo < 60) {
    return "just now";
  } else if (secondsAgo < 3600) {
    // Less than an hour
    const minutes = Math.floor(secondsAgo / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (secondsAgo < 86400) {
    // Less than a day
    const hours = Math.floor(secondsAgo / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (secondsAgo < 604800) {
    // Less than 7 days
    const days = Math.floor(secondsAgo / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // More than 7 days ago, return an absolute date
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

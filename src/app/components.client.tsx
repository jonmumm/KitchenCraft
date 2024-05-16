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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/display/collapsible";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Progress } from "@/components/feedback/progress";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { Textarea } from "@/components/input/textarea";
import { TypeLogo } from "@/components/logo";
import { DietCard } from "@/components/settings/diet-card";
import { EquipmentCard } from "@/components/settings/equipment-card";
import { ExperienceCard } from "@/components/settings/experience-card";
import { GroceryQuestions } from "@/components/settings/grocery";
import { PreferenceCard } from "@/components/settings/preference-card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageSessionSnapshotConditionalRenderer } from "@/components/util/page-session-snapshot-conditiona.renderer";
import { useCraftIsOpen, usePromptIsDirty } from "@/hooks/useCraftIsOpen";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { $diet, $equipment, $preferences } from "@/stores/settings";
import {
  DietSettings,
  EquipmentSettings,
  TasteSettings,
  UserPreferenceType,
} from "@/types";
import { useStore } from "@nanostores/react";
import { ChevronsUpDown, HeartIcon, RefreshCwIcon, XIcon } from "lucide-react";
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
import { useCraftContext } from "./@craft/hooks";
import { CraftContext } from "./context";
import { EQUIPMENT_ITEMS, MISC_ONBORADING_QUESTIONS } from "./data";
import { CraftSnapshot } from "./machine";
import { PageSessionSnapshot } from "./page-session-machine";

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
  const equipment = useStore($equipment);
  const diet = useStore($diet);
  const preferences = useStore($preferences);

  return (
    <div className="relative">
      <div className="flex flex-row gap-2 justify-between items-center px-4 sticky top-0 w-full py-4 bg-card shadow-sm z-10">
        <h2 className="text-xl font-bold">Preferences</h2>
        <Button variant="secondary" event={{ type: "CLOSE" }} autoFocus={false}>
          <XIcon />
        </Button>
      </div>
      <Separator />
      <Accordion type="multiple" className="flex flex-col gap-1">
        <AccordionItem value="experience">
          <AccordionTrigger className="p-4">Experience</AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-3">
            <ExperienceCard level="beginner" />
            <ExperienceCard level="intermediate" />
            <ExperienceCard level="advanced" />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shopping">
          <AccordionTrigger className="p-4">Shopping</AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-3">
            <GroceryQuestions />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="equipment">
          <AccordionTrigger className="p-4">Equipment</AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-3">
            {Object.keys(equipment).map((key) => (
              <EquipmentCard
                key={key}
                equipmentKey={key as keyof EquipmentSettings}
              />
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="diet">
          <AccordionTrigger className="p-4">Diet</AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-3">
            {Object.keys(diet).map((key) => (
              <DietCard key={key} dietKey={key as keyof DietSettings} />
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="taste">
          <AccordionTrigger className="p-4">Taste</AccordionTrigger>
          <AccordionContent className="px-4 flex flex-col gap-3">
            {Object.keys(preferences).map((key) => (
              <PreferenceCard
                key={key}
                preferenceKey={key as keyof TasteSettings}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const selectIsInOnboarding = (snapshot: PageSessionSnapshot) => {
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

const selectIsInOnboardingEquipment = (snapshot: PageSessionSnapshot) => {
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

const selectIsInOnboardingComplete = (snapshot: PageSessionSnapshot) => {
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

const selectIsUserPreferencesInitialized = (snapshot: PageSessionSnapshot) => {
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
  const session$ = usePageSessionStore();
  const active = useSyncExternalStore(
    session$.subscribe,
    () => selectIsUserPreferencesInitialized(session$.get()),
    () => selectIsUserPreferencesInitialized(session$.get())
  );

  return active ? <>{children}</> : <></>;
};

const selectIsUserPreferencesInitializing = (snapshot: PageSessionSnapshot) => {
  return !selectIsUserPreferencesInitialized(snapshot);
};

const IsInitializingUserPreferences = ({
  children,
}: {
  children: ReactNode;
}) => {
  const session$ = usePageSessionStore();
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
  const session$ = usePageSessionStore();

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

export const UpgradeAccountCard = () => {
  return (
    <Card>
      <CardHeader className="relative">
        <TypeLogo className="h-20" />
        <div className="absolute right-0 top-0">
          <Button event={{ type: "CANCEL" }} variant="ghost" autoFocus={false}>
            <XIcon />
          </Button>
        </div>
        <div className="flex flex-row gap-1 items-center justify-between pt-4">
          <div className="flex flex-col gap-1 w-full">
            <CardTitle className="text-center">All Access</CardTitle>
            <CardDescription className="text-center">
              Your personal AI cookbook.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="px-4">
          <Label className="text-muted-foreground">Included benefits</Label>
          <ul className="list-disc pl-6 flex flex-col gap-2 my-4">
            <li>
              <span role="img" aria-label="Infinity">
                ♾️
              </span>{" "}
              Unlimited creation
            </li>
            <li>
              <span role="img" aria-label="Cloud">
                ☁️
              </span>{" "}
              Unlimited storage
            </li>
            <li>
              <span role="img" aria-label="Advanced preferences">
                ✨
              </span>{" "}
              Advanced personalization
            </li>
            <li>
              <span role="img" aria-label="Personal digests">
                🗞️
              </span>{" "}
              Weekly personal digests
            </li>
          </ul>
          <div className="text-center">
            <span className="font-bold">$2 per week</span> after 7-day trial.
          </div>
          <Card className="p-2 my-3">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div className="flex flex-row gap-1 items-center justify-between pl-3">
                  <Label className="text-left leading-4">
                    Share benefits w/ up to 4 people
                  </Label>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2">
                <p className="text-muted-foreground mb-4">
                  Inspire your friends and family to cook with unlimited,
                  personalized, easy to create recipes.
                </p>
                <Label className="text-muted-foreground">
                  Email addresses (optional)
                </Label>
                <div className="flex flex-col gap-2">
                  <Input type="email" />
                  <Input type="email" />
                  <Input type="email" />
                  <Input type="email" />
                </div>
                <CardDescription className="mt-2">
                  Enter emails for up to 4 people you would like to receive
                  benefits.
                </CardDescription>
              </CollapsibleContent>
            </Collapsible>
          </Card>
          <Button size="lg" className="w-full">
            Try 7 Days Free
          </Button>
          <p className="text-center text-semibold text-sm mt-1">
            Cancel or pause anytime.
          </p>
        </div>
      </CardContent>
    </Card>
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
  const store = usePageSessionStore();

  const selector = useCallback(() => {
    const stateValue = store.get().value;
    return (
      typeof stateValue.Auth === "object" &&
      typeof stateValue.Auth.Registering === "object" &&
      !!stateValue.Auth.Registering.InputtingChefName
    );
  }, [store]);

  const active = useSyncExternalStore(store.subscribe, selector, selector);
  return active ? <>{props.children}</> : null;
};

const selectIsCreatingList = (state: CraftSnapshot) => false;
// state.matches({
//   Auth: { LoggedIn: { Adding: { True: { ListCreating: "True" } } } },
// });

const selectIsSelectingList = (state: CraftSnapshot) => false;
// state.matches({ Auth: { LoggedIn: { Adding: "True" } } }) &&
// !selectIsCreatingList(state);

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

export const IsUpgradingAccount = (props: { children: ReactNode }) => {
  // const session$ = usePageSessionStore();
  // const selector = useCallback(() => {
  //   const stateValue = session$.get().value;
  //   const val =
  //     typeof stateValue.Auth === "object" &&
  //     typeof stateValue.Auth.Registering === "object" &&
  //     !!stateValue.Auth.Registering.InputtingEmail;
  //   return val;
  // }, [session$]);

  // const active = useSyncExternalStore(session$.subscribe, selector, selector);
  const active = false;

  return active ? <>{props.children}</> : null;
};

export const IsInputtingEmail = (props: { children: ReactNode }) => {
  const session$ = usePageSessionStore();
  const selector = useCallback(() => {
    const stateValue = session$.get().value;
    const val =
      typeof stateValue.Auth === "object" &&
      typeof stateValue.Auth.Registering === "object" &&
      !!stateValue.Auth.Registering.InputtingEmail;
    return val;
  }, [session$]);

  const active = useSyncExternalStore(session$.subscribe, selector, selector);

  return active ? <>{props.children}</> : null;
};

const useIsLoadingRecipeLists = () => {
  const session$ = usePageSessionStore();

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
  const session$ = usePageSessionStore();

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
            .filter(({ slug }) => slug !== "liked" && slug !== "make-later")
            .toSorted((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        : []
  );
};

const useSuggestedListNames = () => {
  const session$ = usePageSessionStore();

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
  const session$ = usePageSessionStore();

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
  const RecentLists = () => {
    const lists = useSortedRecipeLists();
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
        <Separator />
        <LikedRecipesCard />
        <MakeLaterCard />
      </div>
      <div className="mt-1">
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

const LikedRecipesCard = () => {
  return (
    <Card
      className="p-4 flex items-center justify-between cursor-pointer"
      event={{ type: "SELECT_LIST", listSlug: "liked" }}
    >
      <div className="grid gap-2">
        <h4 className="font-semibold">Liked</h4>
        <p className="text-xs text-muted-foreground">
          Recipes you have{" "}
          <HeartIcon size={14} className="inline -translate-y-0.5" />
          &apos;d.
        </p>
      </div>
      <Button size="sm">Select</Button>
    </Card>
  );
};

const MakeLaterCard = () => {
  return (
    <Card
      className="p-4 flex gap-2 items-center justify-between cursor-pointer"
      event={{ type: "SELECT_LIST", listSlug: "make-later" }}
    >
      <div className="grid gap-2">
        <h4 className="font-semibold">Make Later</h4>
        <p className="text-xs text-muted-foreground">
          Recipes you want to remember to make some time
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

export const CraftStickyHeader = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className="crafting:sticky top-0 crafting:z-50 bg-white dark:bg-slate-950 crafting:shadow-xl crafting:rounded-b-xl border-b-transparent crafting:border-slate-300 crafting:dark:border-slate-700"
      style={{ borderBottomWidth: "1px" }}
    >
      {children}
    </div>
  );
};

export const CarouselOverlay = () => {
  const actor = useCraftContext();
  const isCarouselOpen = useSelector(actor, (state) =>
    state.matches({ Carousel: "Open" })
  );
  return isCarouselOpen ? (
    <div
      style={{ zIndex: 60 }}
      className="bg-black opacity-60 absolute inset-0"
    ></div>
  ) : (
    <></>
  );
};

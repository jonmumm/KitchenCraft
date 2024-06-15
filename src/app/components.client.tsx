"use client";

import { CurrentListCount } from "@/components/current-list-count";
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
import { Ingredients } from "@/components/ingredients";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import { DropdownMenuRadioGroup } from "@/components/input/dropdown-menu";
import { Instructions } from "@/components/instructions";
import { Popover } from "@/components/layout/popover";
import { ScrollArea } from "@/components/layout/scroll-area";
import { TypeLogo } from "@/components/logo";
import { RecipeMoreDropdownButton } from "@/components/recipe-more-dropdown-button";
import { RecipeSelectCircleButton } from "@/components/recipe-select-circle-button";
import { SaveButton } from "@/components/save-button";
import { useScrollLock } from "@/components/scroll-lock";
import { DietCard } from "@/components/settings/diet-card";
import { EquipmentCard } from "@/components/settings/equipment-card";
import { ExperienceCard } from "@/components/settings/experience-card";
import { GroceryQuestions } from "@/components/settings/grocery";
import { PreferenceCard } from "@/components/settings/preference-card";
import { ShareButton } from "@/components/share-button";
import { Tags } from "@/components/tags";
import { Times } from "@/components/times";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Yield } from "@/components/yield";
import { useAppContext } from "@/hooks/useAppContext";
import { useAppSelector } from "@/hooks/useAppSelector";
import { usePageSessionMatchesState } from "@/hooks/usePageSessionMatchesState";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { selectCraftIsOpen } from "@/selectors/app.selectors";
import {
  createRecipeIsSelectedSelector,
  createRecipeSelector,
  createSelectedRecipeAtIndexSelector,
  selectCurrentListRecipeIds,
  selectPromptIsDirty,
  selectSelectedRecipeCount,
} from "@/selectors/page-session.selectors";
import { $diet, $equipment, $preferences } from "@/stores/settings";
import { DietSettings, EquipmentSettings, TasteSettings } from "@/types";
import { useStore } from "@nanostores/react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Portal } from "@radix-ui/react-portal";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDown,
  Circle,
  HeartIcon,
  PlusCircleIcon,
  PlusSquareIcon,
  RefreshCwIcon,
  ScrollIcon,
  ShareIcon,
  ShoppingBasketIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { Inter } from "next/font/google";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ComponentPropsWithoutRef,
  ElementRef,
  ReactNode,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { AppSnapshot } from "./app-machine";
import { AppContext } from "./context";
import { MISC_ONBORADING_QUESTIONS } from "./data";
import "./embla.css";
import { PageSessionSnapshot } from "./page-session-machine";

const inter = Inter({ subsets: ["latin"] });

export const Body = ({
  children,
  isPWA,
}: {
  children: ReactNode;
  isPWA: boolean;
}) => {
  const craftIsOpen = useAppSelector(selectCraftIsOpen);
  const promptIsDirty = usePageSessionSelector(selectPromptIsDirty);

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
              <Button variant="ghost" event={{ type: "LOAD_MORE" }}>
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

const EmptyItemOverlay = ({
  children,
  show,
}: {
  children: ReactNode;
  show: boolean;
}) => {
  return show ? (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col gap-2 items-center justify-center z-70">
        <div>Empty.</div>
        <div>
          <Badge
            event={{ type: "NEW_RECIPE" }}
            variant="secondary"
            className="shadow-md"
          >
            Select More
          </Badge>
        </div>
      </div>
      <div className="absolute inset-0 opacity-20">{children}</div>
    </div>
  ) : (
    <>{children}</>
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

const QuestionHeader = twc.h2`text-lg font-bold`;
const QuestionSubQuestion = twc.h3`text-md font-semibold`;

const CurrentListCarouselItem = ({
  id,
  index,
}: {
  id?: string;
  index: number;
}) => {
  const selectRecipe = useMemo(() => createRecipeSelector(id), [id]);
  const recipe = usePageSessionSelector(selectRecipe);
  const selectRecipeIsSelected = useMemo(
    () => createRecipeIsSelectedSelector(id),
    [id]
  );
  const isSelected = usePageSessionSelector(selectRecipeIsSelected);

  const RecipeName = () => (
    <div className="flex flex-row items-center justify-start flex-1">
      <span className="mr-1 text-muted-foreground flex flex-row gap-2">
        {index + 1}.{" "}
      </span>
      {recipe?.name ? (
        <span className="flex-1">{recipe.name}</span>
      ) : (
        <SkeletonSentence className="h-7 flex-1" numWords={4} />
      )}
    </div>
  );

  return (
    <div className="embla__slide max-h-100 mr-2 first:ml-2 relative">
      <Card className="absolute inset-0 overflow-y-auto">
        <EmptyItemOverlay show={!id}>
          <ScrollArea className="absolute inset-0">
            <div className="h-fit flex flex-col gap-2 py-4">
              <CardTitle className="px-4">
                <div className="flex flex-row gap-2 justify-between">
                  <RecipeName />
                  {/* <RecipeSelectCircleButton id={recipe?.id} /> */}
                </div>
                {/* {recipe?.slug ? (
                  <Link
                    href={`/recipe/${recipe.slug}`}
                    target="_blank"
                    className="flex flex-row items-center justify-between gap-3"
                  >
                    <RecipeName />
                    <Button size="icon" variant="ghost" autoFocus={false}>
                      <ExternalLinkIcon />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-row gap-2">
                    <RecipeName />
                    <Button
                      size="icon"
                      variant="ghost"
                      autoFocus={false}
                      disabled
                    >
                      <ExternalLinkIcon />
                    </Button>
                  </div>
                )} */}
              </CardTitle>
              {recipe?.description ? (
                <CardDescription className="px-4">
                  {recipe.description}
                </CardDescription>
              ) : (
                <div className="flex-1 px-4">
                  <SkeletonSentence className="h-4" numWords={12} />
                </div>
              )}
              <div className="text-muted-foreground text-xs flex flex-row gap-2 px-4">
                <span>Yields</span>
                <span>
                  <Yield recipeId={recipe?.id} />
                </span>
              </div>
            </div>
            <Separator />
            {recipe?.slug && (
              <>
                <div className="flex flex-row gap-2 p-2 max-w-xl mx-auto justify-center">
                  {/* <PrintButton slug={recipe?.slug} /> */}
                  {/* <CameraButton slug={recipe?.slug} /> */}
                  {/* <FavoriteButton id={recipe?.id} /> */}
                  <SaveButton id={recipe?.id} />
                  <ShareButton slug={recipe.slug} name={recipe.name} />
                  <RecipeSelectCircleButton id={recipe.id} />
                  <RecipeMoreDropdownButton />
                </div>
                <Separator />
              </>
            )}
            <div>
              <Times
                activeTime={recipe?.activeTime}
                totalTime={recipe?.totalTime}
                cookTime={recipe?.cookTime}
              />
            </div>
            <Separator />
            <div className="px-5">
              <div className="flex flex-row justify-between gap-1 items-center py-4">
                <h3 className="uppercase text-xs font-bold text-accent-foreground">
                  Ingredients
                </h3>
                <ShoppingBasketIcon />
              </div>
              <div className="mb-4 flex flex-col gap-2">
                <ul className="list-disc pl-5 flex flex-col gap-2">
                  <Ingredients recipeId={recipe?.id} />
                </ul>
              </div>
            </div>
            <Separator />
            <div className="px-5">
              <div className="flex flex-row justify-between gap-1 items-center py-4">
                <h3 className="uppercase text-xs font-bold text-accent-foreground">
                  Instructions
                </h3>
                <ScrollIcon />
              </div>
              <div className="mb-4 flex flex-col gap-2">
                <ol className="list-decimal pl-5 flex flex-col gap-2">
                  <Instructions recipeId={recipe?.id} />
                </ol>
              </div>
            </div>
            <Separator />
            <div className="py-2">
              <Tags recipeId={recipe?.id} />
            </div>
          </ScrollArea>
        </EmptyItemOverlay>
      </Card>
    </div>
  );
};

const useSelectedRecipeAtIndex = (index: number) => {
  const selectSelectedRecipeAtIndex = useMemo(
    () => createSelectedRecipeAtIndexSelector(index),
    [index]
  );
  return usePageSessionSelector(selectSelectedRecipeAtIndex);
};

export const MyRecipesScreen = () => {
  const session$ = usePageSessionStore();
  const [recipeIds] = useState(selectCurrentListRecipeIds(session$.get()));
  const [numItems] = useState(Math.max(recipeIds.length, 3));
  const [items] = useState(new Array(numItems).fill(0));
  useScrollLock(true);

  return (
    <Portal>
      <div className="absolute inset-0 z-70 flex flex-col gap-2 py-2">
        <CurrentListHasPreviousRecipes>
          <Button
            size="icon"
            event={{ type: "PREV" }}
            variant="outline"
            autoFocus={false}
            className="absolute left-2 bottom-2 md:bottom-1/2 md:w-16 md:h-16 md:rounded-full md:shadow-xl z-80 md:bg-blue-500 md:text-white"
          >
            <ChevronLeftIcon />
          </Button>
        </CurrentListHasPreviousRecipes>
        <CurrentListHasNextRecipes>
          <Button
            size="icon"
            event={{ type: "NEXT" }}
            variant="outline"
            autoFocus={false}
            className="absolute right-2 bottom-2 md:bottom-1/2 md:w-16 md:h-16 md:rounded-full md:shadow-xl z-80 md:bg-blue-500 md:text-white"
          >
            <ChevronRightIcon />
          </Button>
        </CurrentListHasNextRecipes>

        <div className="flex flex-row gap-2 justify-between items-center px-2 sticky top-0 w-full max-w-3xl mx-auto">
          <NoRecipesSelected>
            <Badge
              variant="secondary"
              className="text-xs text-semibold bg-card opacity-60"
            >
              CLEAR
            </Badge>
          </NoRecipesSelected>
          <HasSelectedRecipes>
            <Badge
              variant="secondary"
              event={{ type: "CLEAR_SELECTION" }}
              className="text-xs text-semibold shadow-md bg-card"
            >
              CLEAR
            </Badge>
          </HasSelectedRecipes>
          {/* <DropdownMenu> */}
          {/* <DropdownMenuTrigger className="flex-1 flex justify-center"> */}
          <Badge
            variant="outline"
            className="flex gap-2 justify-center text-lg font-bold px-4 py-2 w-full bg-card shadow-lg sm:w-80"
          >
            {/* <ChevronDownIcon /> */}
            <span>Selected</span>
            <span className="ml-1 text-sm font-semibold text-white bg-purple-500 px-1 rounded">
              <CurrentListCount />
            </span>
          </Badge>
          {/* </DropdownMenuTrigger> */}
          {/* <DropdownMenuContent className="z-90">
              <MyRecipeListsRadioGroup />
            </DropdownMenuContent> */}
          {/* </DropdownMenu> */}
          <Button
            variant="ghost"
            event={{ type: "EXIT" }}
            className="text-xs text-semibold shadow-md bg-card rounded-full"
          >
            <XIcon />
          </Button>
        </div>
        <HasSelectedRecipes>
          <CurrentListCarousel>
            {items.map((id, index) => (
              <CurrentListCarouselItem
                key={index}
                id={recipeIds[index]}
                index={index}
              />
            ))}
          </CurrentListCarousel>
        </HasSelectedRecipes>
        <NoRecipesSelected>
          <div className="px-4 flex-1">
            <Card className="h-full max-w-3xl flex mx-auto flex-col gap-2 items-center justify-center">
              <div>No recipes selected.</div>
              <Badge
                event={{ type: "NEW_RECIPE" }}
                variant="secondary"
                className="shadow-md"
              >
                Craft one up.<span className="ml-1">🧪</span>
              </Badge>
            </Card>
          </div>
        </NoRecipesSelected>
        <div className="flex flex-row items-center justify-center gap-2 md:mb-3">
          <IsShareable>
            <Button className="shadow-md" event={{ type: "SHARE_SELECTED" }}>
              <ShareIcon size={16} className="mr-1" />
              Share (<CurrentListCount />)
            </Button>
            {/* <SharePopover>
              <PopoverTrigger asChild>
              </PopoverTrigger>
              <PopoverContent className="w-fit px-2 py-1 z-90">
                URL Copied!
              </PopoverContent>
            </SharePopover> */}
            <Button
              className="shadow-md bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white"
              event={{ type: "ADD_SELECTED" }}
            >
              <PlusSquareIcon size={16} className="mr-1" />
              Add (<CurrentListCount />) to...
            </Button>
          </IsShareable>
          <NoRecipesSelected>
            <Button className="shadow-md" disabled>
              <ShareIcon size={16} className="mr-1" />
              Share (<CurrentListCount />) to...
            </Button>
            <Button
              className="shadow-md bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white"
              disabled
            >
              <PlusCircleIcon size={16} className="mr-1" />
              Add (<CurrentListCount />) to...
            </Button>
          </NoRecipesSelected>
        </div>
      </div>
      <Overlay />
    </Portal>
  );
};

const Overlay = () => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60"></div>
  );
};

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

const selectIsUserPreferencesInitialized = (snapshot: PageSessionSnapshot) => {
  const state = snapshot.value;
  return (
    state.UserPreferences !== "Uninitialized" &&
    state.UserPreferences !== "Initializing"
  );
};

const selectIsUserPreferencesInitializing = (snapshot: PageSessionSnapshot) => {
  return !selectIsUserPreferencesInitialized(snapshot);
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

export const IsInMyCookbook = (props: { children: ReactNode }) => {
  const actor = useContext(AppContext);
  const active = useSelector(actor, (state) =>
    state.matches({ MyCookbook: { Open: "True" } })
  );

  return active ? <>{props.children}</> : null;
};

export const IsInPersonalizationSettings = (props: { children: ReactNode }) => {
  const actor = useContext(AppContext);
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

const selectIsCreatingList = (state: AppSnapshot) => {
  return state.matches({
    Lists: { Selecting: { True: { Creating: "True" } } },
  });
};
// state.matches({
//   Auth: { LoggedIn: { Adding: { True: { ListCreating: "True" } } } },
// });

const selectIsSelectingList = (state: AppSnapshot) => {
  return state.matches({ Lists: { Selecting: "True" } });
};
// state.matches({ Auth: { LoggedIn: { Adding: "True" } } }) &&
// !selectIsCreatingList(state);

export const IsSelectingList = (props: { children: ReactNode }) => {
  const actor = useContext(AppContext);
  const active = useSelector(actor, selectIsSelectingList);
  return active ? <>{props.children}</> : null;
};

export const IsCreatingList = (props: { children: ReactNode }) => {
  const actor = useContext(AppContext);
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

// const useIsLoadingRecipeLists = () => {
//   const session$ = usePageSessionStore();

//   return useSyncExternalStoreWithSelector(
//     session$.subscribe,
//     () => {
//       return session$.get().value;
//     },
//     () => {
//       return session$.get().value;
//     },
//     (value) =>
//       typeof value.Craft === "object" &&
//       typeof value.Craft.Adding === "object" &&
//       typeof value.Craft.Adding.True === "object" &&
//       value.Craft.Adding.True.Lists === "Fetching"
//   );
// };

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
    // const lists = useSortedRecipeLists();
    // const isLoading = useIsLoadingRecipeLists();
    const lists = usePageSessionSelector((state) => {
      return state.context.userSnapshot?.context.listsById || {};
    });
    console.log({ lists });

    return (
      <div className="flex flex-col gap-2 px-4">
        {Object.values(lists).map((item, index) => {
          const name = lists[index]?.name;
          const count = lists[index]?.count;
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
          <CardDescription>Select a list to add to.</CardDescription>
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

const ListItemCard = twc(
  Card
)`p-4 flex items-center justify-between cursor-pointer`;

const LikedRecipesCard = () => {
  return (
    <ListItemCard event={{ type: "SELECT_LIST", listSlug: "liked" }}>
      <div className="grid gap-2">
        <h4 className="font-semibold">Liked</h4>
        <p className="text-xs text-muted-foreground">
          Recipes you have{" "}
          <HeartIcon size={14} className="inline -translate-y-0.5" />
          &apos;d.
        </p>
      </div>
      <Button size="sm">Select</Button>
    </ListItemCard>
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

export const RecipeDetailOverlay = () => {
  const actor = useAppContext();
  const isRecipeDetail = useSelector(actor, (state) =>
    state.matches({ RecipeDetail: "Open" })
  );
  return isRecipeDetail ? (
    <div
      style={{ zIndex: 60 }}
      className="bg-black opacity-60 absolute inset-0"
    ></div>
  ) : (
    <></>
  );
};

const CurrentListHasNextRecipes = ({ children }: { children: ReactNode }) => {
  const actor = useAppContext();
  const carouselAPI = useSelector(actor, (state) => state.context.carouselAPI);
  const canScrollNext = useSyncExternalStore(
    (onStoreChange) => {
      if (!carouselAPI) return () => {};
      carouselAPI.on("slidesInView", onStoreChange);
      return () => {
        carouselAPI.off("slidesInView", onStoreChange);
      };
    },
    () => {
      return carouselAPI?.canScrollNext();
    },
    () => {
      return false;
    }
  );
  return canScrollNext ? <>{children}</> : <></>;
};

const CurrentListHasPreviousRecipes = ({
  children,
}: {
  children: ReactNode;
}) => {
  const actor = useAppContext();
  const carouselAPI = useSelector(actor, (state) => state.context.carouselAPI);
  const canScrollPrev = useSyncExternalStore(
    (onStoreChange) => {
      if (!carouselAPI) return () => {};
      carouselAPI.on("slidesInView", onStoreChange);
      carouselAPI.on("slidesChanged", onStoreChange);
      carouselAPI.on("slideFocus", onStoreChange);
      carouselAPI.on("scroll", onStoreChange);
      carouselAPI.on("settle", onStoreChange);
      return () => {
        carouselAPI.off("slidesInView", onStoreChange);
        carouselAPI.off("slidesChanged", onStoreChange);
        carouselAPI.off("slideFocus", onStoreChange);
        carouselAPI.off("scroll", onStoreChange);
        carouselAPI.off("settle", onStoreChange);
      };
    },
    () => {
      return carouselAPI?.canScrollPrev();
    },
    () => {
      return false;
    }
  );
  return canScrollPrev ? <>{children}</> : <></>;
};

const NoRecipesSelected = ({ children }: { children: ReactNode }) => {
  const isComplete = usePageSessionMatchesState({
    Selection: { Data: "Complete" },
  });
  const session$ = usePageSessionStore();
  const [recipeCount] = useState(selectSelectedRecipeCount(session$.get()));

  return !recipeCount && isComplete ? <>{children}</> : <></>;
};

const IsShareable = ({ children }: { children: ReactNode }) => {
  const isComplete = usePageSessionMatchesState({
    Selection: { Data: "Complete" },
  });
  const recipeCount = usePageSessionSelector(selectSelectedRecipeCount);

  return recipeCount > 0 && isComplete ? <>{children}</> : <></>;
};

const HasSelectedRecipes = ({ children }: { children: ReactNode }) => {
  const isComplete = usePageSessionMatchesState({
    Selection: { Data: "Complete" },
  });
  const session$ = usePageSessionStore();
  const [recipeCount] = useState(selectSelectedRecipeCount(session$.get()));

  return recipeCount > 0 && isComplete ? <>{children}</> : <></>;
};

const MyRecipeListsRadioGroup = () => {
  const send = useSend();
  const handleValueChange = useCallback(
    (listSlug: string) => {
      send({ type: "SELECT_LIST", listSlug });
    },
    [send]
  );

  const actor = useAppContext();
  const recipeIds = usePageSessionSelector(selectCurrentListRecipeIds);

  return (
    <DropdownMenuRadioGroup
      value={"selected"}
      className="w-full"
      onValueChange={handleValueChange}
    >
      <RecipeListRadioItem value="selected" className="py-4">
        <div className="flex flex-row gap-2 w-56">
          <span className="flex-1">
            <span className="mr-1">✅</span> Selected
          </span>
          <span className="ml-1 text-sm font-semibold text-white bg-purple-500 px-1 rounded">
            <CurrentListCount />
          </span>
        </div>
      </RecipeListRadioItem>
      <Separator className="my-1" />
      <RecipeListRadioItem value="my-recipes" className="py-4">
        <div className="flex flex-row gap-2 w-56">
          <span className="mr-1">📒</span>
          <div className="flex-1 flex flex-col gap-2">
            <span className="font-medium">My Recipes</span>
            <span className="text-xs text-muted-foreground">Public</span>
          </div>
          <div>
            <span className="ml-1 text-sm font-semibold bg-slate-200 dark:bg-slate-800 px-1 rounded">
              0
            </span>
          </div>
        </div>
      </RecipeListRadioItem>
      <RecipeListRadioItem value="liked" className="py-4">
        <div className="flex flex-row gap-2 w-56">
          <span className="mr-1">️👍</span>
          <div className="flex-1 flex flex-col gap-2">
            <span className="font-medium">Liked</span>
            <span className="text-xs text-muted-foreground">Public</span>
          </div>
          <div>
            <span className="ml-1 text-sm font-semibold bg-slate-200 dark:bg-slate-800 px-1 rounded">
              40
            </span>
          </div>
        </div>
      </RecipeListRadioItem>
      <RecipeListRadioItem value="commented" className="py-4">
        <div className="flex flex-row gap-2 w-56">
          <span className="mr-1">️💬</span>
          <div className="flex-1 flex flex-col gap-2">
            <span className="font-medium">Commented On</span>
            <span className="text-xs text-muted-foreground">Public</span>
          </div>
          <div>
            <span className="ml-1 text-sm font-semibold bg-slate-200 dark:bg-slate-800 px-1 rounded">
              0
            </span>
          </div>
        </div>
      </RecipeListRadioItem>
      <RecipeListRadioItem value="make-later" className="py-4">
        <div className="flex flex-row gap-2 w-56">
          <span className="mr-1">⏰</span>
          <div className="flex-1 flex flex-col gap-2">
            <span className="font-medium">Make Later</span>
            <span className="text-xs text-muted-foreground">Private</span>
          </div>
          <div>
            <span className="ml-1 text-sm font-semibold bg-slate-200 dark:bg-slate-800 px-1 rounded">
              0
            </span>
          </div>
        </div>
      </RecipeListRadioItem>
      <RecipeListRadioItem value="favorites" className="py-4">
        <div className="flex flex-row gap-2 w-56">
          <span className="mr-1">⭐️</span>
          <div className="flex-1 flex flex-col gap-2">
            <span className="font-medium">Favorites</span>
            <span className="text-xs text-muted-foreground">Private</span>
          </div>
          <div>
            <span className="ml-1 text-sm font-semibold bg-slate-200 dark:bg-slate-800 px-1 rounded">
              37
            </span>
          </div>
        </div>
      </RecipeListRadioItem>
      <Separator className="my-1" />
      <div className="flex items-center justify-center py-2">
        <Badge
          variant="outline"
          className="cursor-pointer"
          event={{ type: "CREATE_LIST" }}
        >
          Create New List
          <PlusCircleIcon className="ml-1" />
        </Badge>
      </div>
    </DropdownMenuRadioGroup>
  );
};

const RecipeListRadioItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent dark:data-[state=checked]:bg-slate-900 data-[state=checked]:font-semibold data-[state=checked]:bg-slate-100 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
  </DropdownMenuPrimitive.RadioItem>
));
RecipeListRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

export const CurrentListCarousel = ({ children }: { children: ReactNode }) => {
  const [emblaRef, emblaAPI] = useEmblaCarousel();
  const initializedRef = useRef(false);
  const send = useSend();
  useEffect(() => {
    if (!emblaAPI || initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    send({ type: "MOUNT_CAROUSEL", carouselAPI: emblaAPI });

    return () => {
      send({ type: "UNMOUNT_CAROUSEL" });
    };
  }, [emblaAPI, send]);

  return (
    <div ref={emblaRef} className="embla flex-1 relative">
      <div className="embla__container absolute inset-0">{children}</div>
    </div>
  );
};

const SharePopover = ({ children }: { children: ReactNode }) => {
  const [showCopied, setShowCopied] = useState(false);
  const send = useSend();
  const selectedListId = usePageSessionSelector(
    (state) => state.context.sessionSnapshot?.context.selectedListId
  );

  const handlePressCopy = useCallback(() => {
    if (!selectedListId) {
      return;
    }
    send({ type: "SHARE_SELECTED" });

    const { origin } = window.location;
    const url = `${origin}/list/${selectedListId}`;

    if ("share" in navigator) {
      navigator
        .share({
          url,
        })
        .then(() => {
          // todo prompt to save it?
          // send({ type: "SHARE_COMPLETE", id });
        })
        .catch(() => {
          // send({ type: "SHARE_CANCEL", slug });
        });
    } else if ("clipboard" in navigator) {
      // @ts-ignore
      navigator.clipboard.writeText(url);

      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
      }, 3000);
    }
  }, [setShowCopied, selectedListId, send]);

  return (
    <Popover open={showCopied} onOpenChange={handlePressCopy}>
      {children}
    </Popover>
  );
};

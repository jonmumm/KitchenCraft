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
import { Input } from "@/components/input";
import { BackButton } from "@/components/input/back-button";
import { Button } from "@/components/input/button";
import { Checkbox } from "@/components/input/checkbox";
import { TypeLogo } from "@/components/logo";
import { DietCard } from "@/components/settings/diet-card";
import { EquipmentCard } from "@/components/settings/equipment-card";
import { ExperienceCard } from "@/components/settings/experience-card";
import { GroceryQuestions } from "@/components/settings/grocery";
import { PreferenceCard } from "@/components/settings/preference-card";
import { PageSessionMatches } from "@/components/util/page-session-matches";
import { useAppContext } from "@/hooks/useAppContext";
import { useAppSelector } from "@/hooks/useAppSelector";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useRecipeListById } from "@/hooks/useRecipeListById";
import { useRecipeListBySlug } from "@/hooks/useRecipeListBySlug";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { selectCraftIsOpen } from "@/selectors/app.selectors";
import { selectPromptIsDirty, selectRecentCreatedListIds } from "@/selectors/page-session.selectors";
import { $diet, $equipment, $preferences } from "@/stores/settings";
import { DietSettings, EquipmentSettings, TasteSettings } from "@/types";
import { useStore } from "@nanostores/react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronsUpDown,
  Circle,
  HeartIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Inter } from "next/font/google";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ComponentPropsWithoutRef,
  ElementRef,
  ReactNode,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { twc } from "react-twc";
import { toast } from "sonner";
import { EnterEmailForm, EnterListNameForm } from "./@craft/components.client";
import { AppSnapshot } from "./app-machine";
import { AppContext } from "./context";
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

// export const EnterChefNameCard = () => {
//   const ChefNameSuggestions = () => {
//     const suggestedChefNames = useSuggestedChefnames();
//     const items = new Array(6).fill("");

//     return (
//       <>
//         {items.map((item, index) => {
//           return (
//             <div key={index} className="carousel-item">
//               {suggestedChefNames.length > index ? (
//                 <Badge
//                   event={{
//                     type: "SELECT_VALUE",
//                     name: "suggested_chefname",
//                     value: suggestedChefNames[index]!,
//                   }}
//                 >
//                   {suggestedChefNames[index]}
//                 </Badge>
//               ) : (
//                 <Badge>
//                   <Skeleton className="h-4 w-7" />
//                 </Badge>
//               )}
//             </div>
//           );
//         })}
//       </>
//     );
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex flex-row gap-1 items-center justify-between">
//           <div className="flex flex-col gap-1">
//             <CardTitle>Your Chef Name</CardTitle>
//             <CardDescription>
//               Choose a name so you and others can quickly access your saved
//               recipes. Must be unique.
//             </CardDescription>
//             <div className="flex flex-row justify-between items-center">
//               <Label className="uppercase text-xs text-muted-foreground">
//                 Suggestions
//               </Label>
//               <Button variant="ghost" event={{ type: "LOAD_MORE" }}>
//                 <RefreshCwIcon size={14} />
//               </Button>
//             </div>
//             <div className="flex flex-1 gap-1 flex-wrap">
//               <ChefNameSuggestions />
//             </div>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <EnterChefNameForm />
//       </CardContent>
//     </Card>
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

export const IsInPersonalizationSettings = (props: { children: ReactNode }) => {
  const actor = useContext(AppContext);
  const active = useSelector(actor, (state) =>
    state.matches({ PersonalizationSettings: "Open" })
  );

  return active ? <>{props.children}</> : null;
};

// export const IsInputtingChefName = (props: { children: ReactNode }) => {
//   const store = usePageSessionStore();

//   const selector = useCallback(() => {
//     const stateValue = store.get().value;
//     return (
//       typeof stateValue.Auth === "object" &&
//     );
//   }, [store]);

//   const active = useSyncExternalStore(store.subscribe, selector, selector);
//   return active ? <>{props.children}</> : null;
// };

const selectIsSelectingList = (state: AppSnapshot) => {
  return state.matches({ Lists: { Selecting: "True" } });
};

export const IsSelectingList = (props: { children: ReactNode }) => {
  const actor = useContext(AppContext);
  const active = useSelector(actor, selectIsSelectingList);
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

export const SelectListDialog = () => {
  const recentCreated = usePageSessionSelector(selectRecentCreatedListIds);

  return (
    <div className="overflow-y-auto max-h-[95svh] py-4">
      <div className="flex flex-row gap-1 items-center justify-between p-4">
        <div className="flex flex-col justify-center">
          <CardTitle>Save To...</CardTitle>
          <CardDescription>Store this recipe in these lists:</CardDescription>
        </div>
        <Badge variant="outline">
          New List <PlusIcon className="ml-1" size={14} />
        </Badge>
      </div>
      <div className="px-4 flex flex-col gap-4">
        <ChooseListItemCardBySlug slug="liked" />
        <ChooseListItemCardBySlug slug="make-later" />
        {recentCreated?.map((id) => (
          <ChooseListItemCardById key={id} id={id} />
        ))}
      </div>
      <div className="p-4">
        <BackButton variant="default" className="w-full" size="xl">
          Done
        </BackButton>
      </div>
    </div>
  );
};

const ChooseListItemCardById = ({ id }: { id: string }) => {
  const list = useRecipeListById(id);
  const t = useTranslations("General");

  return (
    <Card className="flex flex-row justify-between items-center gap-3 p-4">
      <span className="text-2xl">{list?.icon}</span>
      <div className="flex flex-col flex-1">
        <h4 className="text-xl font-semibold">#{list?.slug}</h4>
        <p className="text-muted-foreground text-sm">
          {t("recipeCount", { count: list?.count })}
        </p>
      </div>
      <Checkbox size="large" />
    </Card>
  );
};

const ChooseListItemCardBySlug = ({ slug }: { slug: string }) => {
  const list = useRecipeListBySlug(slug);
  const t = useTranslations("General");

  return (
    <Card className="flex flex-row justify-between items-center gap-3 p-4">
      <span className="text-2xl">{list?.icon}</span>
      <div className="flex flex-col flex-1">
        <h4 className="text-xl font-semibold">#{slug}</h4>
        <p className="text-muted-foreground text-sm">
          {t("recipeCount", { count: list?.count })}
        </p>
      </div>
      <Checkbox size="large" />
    </Card>
  );
};

export const CreateNewListCard = () => {
  return (
    <Card className="py-4 w-full">
      <div className="flex flex-row gap-1 items-center justify-between px-4">
        <div className="flex flex-col gap-1 mb-2">
          <PageSessionMatches matchedState={{ ListCreating: "True" }}>
            <CardTitle>New Recipe List</CardTitle>
            <CardDescription>Enter a name for your new list.</CardDescription>
          </PageSessionMatches>
          <PageSessionMatches
            matchedState={{ ListCreating: { Error: "DuplicateName" } }}
          >
            <CardTitle className="text-error">Duplicate Name</CardTitle>
            <CardDescription>
              You have already created a list with this name. Try changing it to
              something else.
            </CardDescription>
          </PageSessionMatches>
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

"use client";

import { CurrentListCount } from "@/components/current-list-count";
import { Badge } from "@/components/display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Ingredients } from "@/components/ingredients";
import { Button } from "@/components/input/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/input/dropdown-menu";
import { Instructions } from "@/components/instructions";
import { Popover } from "@/components/layout/popover";
import { ScrollArea } from "@/components/layout/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/navigation/tabs";
import { RecipeMoreDropdownButton } from "@/components/recipe-more-dropdown-button";
import { RecipeSelectCircleButton } from "@/components/recipe-select-circle-button";
import { SaveButton } from "@/components/save-button";
import { useScrollLock } from "@/components/scroll-lock";
import { ShareRecipeButton } from "@/components/share-button";
import { Tags } from "@/components/tags";
import { Times } from "@/components/times";
import { PageSessionMatches } from "@/components/util/page-session-matches";
import { Yield } from "@/components/yield";
import { useAppContext } from "@/hooks/useAppContext";
import { usePageSessionMatchesState } from "@/hooks/usePageSessionMatchesState";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import {
  createListBySlugSelector,
  createRecipeIsSelectedSelector,
  createRecipeSelector,
  selectSelectedRecipeCount,
  selectSelectedRecipeIds,
} from "@/selectors/page-session.selectors";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Portal } from "@radix-ui/react-portal";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowLeftIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Circle,
  PlusCircleIcon,
  ScrollIcon,
  ShareIcon,
  ShoppingBasketIcon,
  XIcon,
} from "lucide-react";
import {
  ComponentPropsWithoutRef,
  ElementRef,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { twc } from "react-twc";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { EnterListNameForm } from "./@craft/components.client";
import "./embla.css";

export const MyRecipesScreen = () => {
  const session$ = usePageSessionStore();
  const [recipeIds] = useState(selectSelectedRecipeIds(session$.get()));
  const [numItems] = useState(Math.max(recipeIds?.length || 0, 3));
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
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            className="text-xs text-semibold shadow-md bg-card rounded-full"
          >
            <ArrowLeftIcon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex-1 flex justify-center">
              <Badge
                variant="outline"
                className="flex gap-2 justify-between text-lg font-bold px-3 py-2 w-full bg-card shadow-lg sm:w-80"
              >
                <div className="flex-1 text-start">
                  <span className="ml-2 mr-2">✅</span>
                  <span>Selected</span>
                </div>
                <span className="ml-1 text-sm font-semibold text-white bg-purple-700 px-1 rounded">
                  <CurrentListCount />
                </span>
                <div>
                  <Button
                    size="icon"
                    className="rounded-full p-2"
                    variant="secondary"
                  >
                    <ChevronDownIcon />
                  </Button>
                </div>
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-90 max-h-[75vh] overflow-y-scroll">
              <MyRecipeListsRadioGroup />
            </DropdownMenuContent>
          </DropdownMenu>
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
        </div>
        <div className="flex-1">
          <Tabs defaultValue="recipe" className="h-full flex flex-col">
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recipe">Recipe</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={"recipe"} className="flex-1 flex flex-col">
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
              <HasSelectedRecipes>
                <CurrentListCarousel>
                  {items.map((id, index) => (
                    <CurrentListCarouselItem
                      key={index}
                      id={recipeIds?.[index]}
                      index={index}
                    />
                  ))}
                </CurrentListCarousel>
              </HasSelectedRecipes>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-row items-center justify-center gap-2 md:mb-3">
          <IsShareable>
            <Button className="shadow-md" event={{ type: "SHARE_SELECTED" }}>
              <ShareIcon size={16} className="mr-1" />
              Share (<CurrentListCount />)
            </Button>
            <Button className="shadow-md" event={{ type: "SAVE_SELECTED" }}>
              <BookmarkIcon size={16} className="mr-1" />
              Save (<CurrentListCount />) to...
            </Button>
          </IsShareable>
          <NoRecipesSelected>
            <Button className="shadow-md" disabled>
              <ShareIcon size={16} className="mr-1" />
              Share (<CurrentListCount />) to...
            </Button>
            <Button className="shadow-md" variant="primary" disabled>
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
                </div>
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
                  <SaveButton id={recipe?.id} />
                  <ShareRecipeButton slug={recipe.slug} name={recipe.name} />
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

const Overlay = () => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60"></div>
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

export const SelectListCard = () => {
  const RecentLists = () => {
    // const lists = useSortedRecipeLists();
    // const isLoading = useIsLoadingRecipeLists();
    const lists = usePageSessionSelector((state) => {
      return state.context.listsById || {};
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
  return (
    <Card className="py-4">
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
  const recipeIds = usePageSessionSelector(selectSelectedRecipeIds);

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
      <RecipeListRadioItemBySlug slug="make-later" />
      <RecipeListRadioItemBySlug slug="commented" />
      <RecipeListRadioItemBySlug slug="liked" />
      <RecipeListRadioItemBySlug slug="favorites" />
      <Separator className="my-1" />
      <div>
        <Label className="text-muted-foreground text-xs uppercase">
          Recently Created
        </Label>
      </div>
      <div className="carousel gap-2">
        <div className="carousel-item">
          <Card className="w-32 h-12"></Card>
        </div>
        <div className="carousel-item">
          <Card className="w-32 h-12"></Card>
        </div>
      </div>
      <Separator className="my-1" />
      <div>
        <Label className="text-muted-foreground text-xs uppercase">
          Recently Shared
        </Label>
      </div>
      <div className="carousel gap-2">
        <div className="carousel-item">
          <Card className="w-32 h-12"></Card>
        </div>
        <div className="carousel-item">
          <Card className="w-32 h-12"></Card>
        </div>
      </div>
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

const RecipeListRadioItemBySlug = ({ slug }: { slug: string }) => {
  const selectList = useMemo(() => createListBySlugSelector(slug), [slug]);
  const list = usePageSessionSelector(selectList);

  return (
    <RecipeListRadioItem value="make-later" className="py-4">
      <div className="flex flex-row gap-2 w-56">
        <span className="mr-1">{list?.icon ? <>{list.icon}</> : <>#️⃣</>}</span>
        <div className="flex-1 flex flex-col gap-2">
          <span className="font-medium">
            {list?.name ? <>{list.name}</> : <Skeleton className="w-12 h-4" />}
          </span>
          <span className="text-xs text-muted-foreground">Private</span>
        </div>
        <div>
          <span className="ml-1 text-sm font-semibold bg-slate-200 dark:bg-slate-800 px-1 rounded">
            {list?.count !== undefined ? (
              <>{list?.count}</>
            ) : (
              <Skeleton className="w-4 h-3 animate-none dark:bg-slate-600" />
            )}
          </span>
        </div>
      </div>
    </RecipeListRadioItem>
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

const CurrentListCarousel = ({ children }: { children: ReactNode }) => {
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

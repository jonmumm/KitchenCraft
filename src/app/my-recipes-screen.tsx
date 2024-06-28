"use client";

import { Badge } from "@/components/display/badge";
import { Card, CardDescription, CardTitle } from "@/components/display/card";
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
import { ScrollArea } from "@/components/layout/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/navigation/tabs";
import { RecipeMoreDropdownButton } from "@/components/recipe-more-dropdown-button";
import { SaveButton } from "@/components/save-button";
import { useScrollLock } from "@/components/scroll-lock";
import { ShareRecipeButton } from "@/components/share-button";
import { Tags } from "@/components/tags";
import { Times } from "@/components/times";
import { appSelectorComponent } from "@/components/util/app-selector";
import { combinedSelectorComponent } from "@/components/util/combined-selector";
import { PageSessionSelectorLink } from "@/components/util/page-session-selector-link";
import { Yield } from "@/components/yield";
import { useAppContext } from "@/hooks/useAppContext";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useCombinedSelector } from "@/hooks/useCombinedSelector";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionMatchesState } from "@/hooks/usePageSessionMatchesState";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useRecipeListBySlug } from "@/hooks/useRecipeListBySlug";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import {
  selectCurrentListIsSelected,
  selectCurrentListSlug,
} from "@/selectors/app.selectors";
import {
  selectCurrentListCount,
  selectCurrentListItems,
  selectHasRecipesInCurrentList,
} from "@/selectors/combined.selectors";
import {
  createListByIdSelector,
  createListBySlugSelector,
  createRecipeSelector,
  selectRecentCreatedListIds,
  selectRecentSharedListIds,
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
  ListPlusIcon,
  PlusCircleIcon,
  ScrollIcon,
  ShareIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import Link from "next/link";
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
import { createSelector } from "reselect";
import "./embla.css";

export const MyRecipesScreen = () => {
  const currentSlug = useAppSelector(selectCurrentListSlug);
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
          <MyRecipesDropdownMenu>
            <DropdownMenuTrigger className="flex-1 flex justify-center">
              <Badge
                variant="outline"
                className="flex gap-2 justify-between text-lg font-bold px-3 py-2 w-full bg-card shadow-lg sm:w-80"
              >
                <div className="flex-1 text-start flex gap-1 max-w-full items-center">
                  <span className="ml-2 mr-2">
                    <CurrentListIcon />
                  </span>
                  <span className="truncate flex-1">
                    <CurrentListSlug />
                  </span>
                  <span
                    className={cn(
                      "mx-1 text-sm font-semibold text-white px-1 rounded",
                      currentSlug === "selected"
                        ? "bg-purple-700 "
                        : "bg-slate-700"
                    )}
                  >
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
                </div>
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-90 max-h-[75vh] overflow-y-scroll">
              <MyRecipeListsRadioGroup />
            </DropdownMenuContent>
          </MyRecipesDropdownMenu>
          <Button variant="outline" size="icon" event={{ type: "CREATE_LIST" }}>
            <ListPlusIcon />
          </Button>
        </div>
        <div className="flex-1">
          <Tabs defaultValue="recipe" className="h-full flex flex-col">
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
                <TabsTrigger value="recipe">Recipe</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={"recipe"} className="flex-1 flex flex-col">
              <HasRecipesInCurrentList not>
                <div className="px-4 flex-1">
                  <Card className="h-full max-w-3xl flex mx-auto flex-col gap-2 items-center justify-center">
                    <div>No recipes in list.</div>
                    <Badge
                      event={{ type: "NEW_RECIPE" }}
                      variant="secondary"
                      className="shadow-md"
                    >
                      Craft one up.<span className="ml-1">🧪</span>
                    </Badge>
                  </Card>
                </div>
              </HasRecipesInCurrentList>
              <HasRecipesInCurrentList>
                <CurrentListCarousel>
                  <CurrentListItems />
                </CurrentListCarousel>
              </HasRecipesInCurrentList>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-row items-center justify-center gap-2 md:mb-3">
          <CurrentListIsSelected>
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
          </CurrentListIsSelected>
          <CurrentListIsSelected not>
            <IsShareable>
              <Button
                className="shadow-md"
                event={{ type: "SHARE_CURRENT_LIST" }}
              >
                <ShareIcon size={16} className="mr-1" />
                Share #<CurrentListSlug />
              </Button>
            </IsShareable>
            <NoRecipesSelected>
              <Button className="shadow-md" disabled>
                <ShareIcon size={16} className="mr-1" />
                Share #<CurrentListSlug />
              </Button>
            </NoRecipesSelected>
          </CurrentListIsSelected>
        </div>
      </div>
      <Overlay />
    </Portal>
  );
};

const MyRecipesDropdownMenu = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      setOpen(value);
    },
    [setOpen]
  );

  useEventHandler("CREATE_LIST", () => {
    setOpen(false);
  });

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      {children}
    </DropdownMenu>
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
        <CurrentListIsSelected not>
          <div className="opacity-60">Empty.</div>
        </CurrentListIsSelected>
        <CurrentListIsSelected>
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
        </CurrentListIsSelected>
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
                  <ShareRecipeButton slug={recipe.slug} name={recipe.name} />
                  {/* <LikeButton id={recipe?.id} /> */}
                  <SaveButton id={recipe?.id} />
                  <RecipeMoreDropdownButton id={recipe?.id} />
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

const CurrentListIsSelected = appSelectorComponent(selectCurrentListIsSelected);
const HasRecipesInCurrentList = combinedSelectorComponent(
  selectHasRecipesInCurrentList
);

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
  const [currentValue, setCurrentValue] = useState(
    window.location.hash.slice(1)
  );
  const handleValueChange = useCallback(
    (listSlug: string) => {
      setCurrentValue(listSlug);
      send({ type: "SELECT_LIST", listSlug });
    },
    [send]
  );

  const recentCreated = usePageSessionSelector(selectRecentCreatedListIds);
  const recentShared = usePageSessionSelector(selectRecentSharedListIds);

  return (
    <DropdownMenuRadioGroup
      value={currentValue}
      className="w-full"
      onValueChange={handleValueChange}
    >
      {/* <RecipeListRadioItemSelected /> */}
      <RecipeListRadioItemBySlug slug="liked" />
      <RecipeListRadioItemBySlug slug="make-later" />
      <RecipeListRadioItemBySlug slug="favorites" />
      <RecipeListRadioItemBySlug slug="commented" />
      {recentCreated?.length ? (
        <>
          <div className="px-2">
            <Label className="text-muted-foreground text-xs uppercase">
              Recent Created
            </Label>
          </div>
          <Separator className="my-1" />
          {recentCreated.map((id) => {
            return <RecipeListRadioItemById key={id} id={id} />;
          })}
        </>
      ) : (
        <></>
      )}

      {recentShared?.length ? (
        <>
          <div className="px-2">
            <Label className="text-muted-foreground text-xs uppercase">
              Recent Shared
            </Label>
          </div>
          <Separator className="my-1" />
          {recentShared.map((id) => {
            return <RecipeListRadioItemById key={id} id={id} />;
          })}
        </>
      ) : (
        <></>
      )}
      {/* <Separator className="my-1" />
      <div className="flex items-center justify-center py-2">
        <Badge
          variant="outline"
          className="cursor-pointer"
          event={{ type: "CREATE_LIST" }}
        >
          Create New List
          <PlusCircleIcon className="ml-1" />
        </Badge>
      </div> */}
    </DropdownMenuRadioGroup>
  );
};

const RecipeListRadioItemById = ({ id }: { id: string }) => {
  const selectList = useMemo(() => createListByIdSelector(id), [id]);
  const selectSlug = useMemo(
    () => createSelector(selectList, (list) => `#${list?.slug}`),
    [selectList]
  );
  const list = usePageSessionSelector(selectList);

  return (
    <PageSessionSelectorLink selector={selectSlug}>
      <RecipeListRadioItem value={list?.slug || ""} className="py-4">
        <div className="flex flex-row gap-2 w-56">
          <span className="mr-1">
            {list?.icon ? <>{list.icon}</> : <>#️⃣</>}
          </span>
          <div className="flex-1 flex flex-col gap-2">
            <span className="font-medium">
              {list?.slug ? (
                <>{list.slug}</>
              ) : (
                <Skeleton className="w-12 h-4" />
              )}
            </span>
          </div>
          <div>
            <span
              className={cn(
                "ml-1 text-sm font-semibold px-1 rounded bgslate-200 dark:bg-slate-800"
              )}
            >
              {list?.count !== undefined ? (
                <>{list?.count}</>
              ) : (
                <Skeleton className="w-4 h-3 animate-none dark:bg-slate-600" />
              )}
            </span>
          </div>
        </div>
      </RecipeListRadioItem>
    </PageSessionSelectorLink>
  );
};

const RecipeListRadioItemBySlug = ({ slug }: { slug: string }) => {
  const list = useRecipeListBySlug(slug);

  return (
    <Link href={`#${slug}`}>
      <RecipeListRadioItem value={slug} className="py-4">
        <div className="flex flex-row gap-2 w-56">
          <span className="mr-1">
            {list?.icon ? <>{list.icon}</> : <>#️⃣</>}
          </span>
          <div className="flex-1 flex flex-col gap-2">
            <span className="font-medium">
              {list?.slug ? (
                <>#{list.slug}</>
              ) : (
                <Skeleton className="w-12 h-4" />
              )}
            </span>
          </div>
          <div>
            <span
              className={cn(
                "ml-1 text-sm font-semibold px-1 rounded",
                list?.slug === "selected"
                  ? "bg-purple-700"
                  : "bgslate-200 dark:bg-slate-800"
              )}
            >
              {list?.count !== undefined ? (
                <>{list?.count}</>
              ) : (
                <Skeleton className="w-4 h-3 animate-none dark:bg-slate-600" />
              )}
            </span>
          </div>
        </div>
      </RecipeListRadioItem>
    </Link>
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

const CurrentListItems = () => {
  const recipeIdSet = useCombinedSelector(selectCurrentListItems);
  console.log({ recipeIdSet });
  const recipeIds = recipeIdSet ? Object.keys(recipeIdSet) : [];
  const [numItems] = useState(Math.max(recipeIds?.length || 0, 3));
  const [items] = useState(new Array(numItems).fill(0));

  return (
    <>
      {items.map((id, index) => (
        <CurrentListCarouselItem
          key={index}
          id={recipeIds?.[index]}
          index={index}
        />
      ))}
    </>
  );
};

const SelectedCarouselItems = () => {
  const session$ = usePageSessionStore();
  const [recipeIds] = useState(selectSelectedRecipeIds(session$.get()));
  const [numItems] = useState(Math.max(recipeIds?.length || 0, 3));
  const [items] = useState(new Array(numItems).fill(0));

  return (
    <>
      {items.map((id, index) => (
        <CurrentListCarouselItem
          key={index}
          id={recipeIds?.[index]}
          index={index}
        />
      ))}
    </>
  );
};

export const CurrentListIcon = () => {
  const slug = useAppSelector(selectCurrentListSlug);
  const selectList = useMemo(() => createListBySlugSelector(slug), [slug]);
  const list = usePageSessionSelector(selectList);
  return <>{list?.icon}</>;
};

export const CurrentListSlug = () => {
  const slug = useAppSelector(selectCurrentListSlug);
  const selectList = useMemo(() => createListBySlugSelector(slug), [slug]);
  const list = usePageSessionSelector(selectList);
  return <>{list?.slug}</>;
};

export const CurrentListName = () => {
  const slug = useAppSelector(selectCurrentListSlug);
  const selectList = useMemo(() => createListBySlugSelector(slug), [slug]);
  const list = usePageSessionSelector(selectList);
  return <>{list?.name}</>;
};

export const CurrentListCount = () => {
  const count = useCombinedSelector(selectCurrentListCount);
  return <>{count}</>;
};

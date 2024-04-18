import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/input/dropdown-menu";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { AsyncRenderLastValue } from "@/components/util/async-render-last-value";
import { getProfileBySlug, getRecentRecipesByProfile } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { getIsMobile } from "@/lib/headers";
import { formatJoinDateStr } from "@/lib/utils";
import { ProfileSlugSchema } from "@/schema";
import { ChefHatIcon, MoreVerticalIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { from, map, shareReplay } from "rxjs";
import { RecipeListItem } from "../recipe/components";

const NUM_PLACEHOLDER_RECIPES = 30;

export default async function Page(props: { params: { slug: string } }) {
  const currentUserId = await getCurrentUserId();
  const slug = decodeURIComponent(props.params.slug);
  const isMobile = getIsMobile();

  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (!profileParse.success) {
    redirect("/");
  }
  const profileSlug = profileParse.data.slice(1);

  const [recipes$, profile$] = [
    from(getRecentRecipesByProfile(profileSlug)).pipe(shareReplay(1)),
    from(getProfileBySlug(profileSlug)).pipe(shareReplay(1)),
  ];

  const claimDate$ = profile$.pipe(map((profile) => profile?.createdAt));
  const isOwner$ = profile$.pipe(
    map((profile) => profile?.userId === currentUserId)
  );

  const ClaimDate = () => {
    return (
      <AsyncRenderFirstValue
        observable={claimDate$}
        render={(claimDate) => (
          <>{claimDate ? formatJoinDateStr(claimDate) : <>Unclaimed</>}</>
        )}
        fallback={<Skeleton className="w-full h-4" />}
      />
    );
  };

  return (
    <div className="flex flex-col">
      <div className="w-full max-w-2xl mx-auto p-4 gap-2 flex flex-col mb-8">
        <Card className="py-4">
          <div className="flex flex-col sm:flex-row gap-2 px-4">
            <div className="flex flex-row gap-4 items-center flex-1">
              <Avatar>
                {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                <AvatarFallback>
                  <ChefHatIcon />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex flex-row gap-1 items-center justify-between">
                  <h1 className="underline font-bold text-xl">{profileSlug}</h1>
                  <AsyncRenderFirstValue
                    observable={isOwner$}
                    render={(isOwner) => {
                      return isOwner ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVerticalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Link href="/edit-profile">Edit Chef Name</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null;
                    }}
                    fallback={undefined}
                  />
                </div>
                <div>
                  <Badge variant="outline">
                    <ClaimDate />
                  </Badge>
                </div>
              </div>
            </div>
            {/* <div className="min-w-0">
              <ResponsiveDialog isMobile={isMobile}>
                <ResponsiveDialogTrigger asChild>
                  <Button className="h-full w-full" variant="ghost">
                    <SettingsIcon />
                  </Button>
                </ResponsiveDialogTrigger>
                <ResponsiveDialogOverlay />
                <ResponsiveDialogContent>Hello</ResponsiveDialogContent>
              </ResponsiveDialog>
            </div> */}
          </div>
        </Card>
        {/* <AsyncRenderFirstValue
          observable={combineLatest([profile$, isOwner$])}
          render={([profile, isOwner]) => {
            return (
              isOwner &&
              !profile?.activated && (
                <Card className="text-primary text-sm flex flex-row gap-2 justify-between items-center py-2 px-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="flex-1 text-sm text-muted-foreground font-semibold">
                      Not Active
                    </h3>
                    <p className="text-xs flex-1">
                      Chef pages are available for Chef&apos;s Club members
                    </p>
                  </div>
                  <Link href="/chefs-club">
                    <Button className="whitespace-nowrap">
                      Join Chef&apos;s Club
                    </Button>
                  </Link>
                </Card>
              )
            );
          }}
          fallback={<Skeleton />}
        /> */}
      </div>
      <div className="w-full flex flex-col gap-4">
        {/* Display the recipes using RecipeListItem */}
        <div className="flex flex-col gap-12">
          {new Array(NUM_PLACEHOLDER_RECIPES).fill(0).map((_, index) => (
            <AsyncRenderLastValue
              key={index}
              fallback={null}
              observable={
                recipes$
                // recipesByIndex$[index]?.pipe(defaultIfEmpty(undefined))!
              }
              render={(recipes) => {
                const recipe = recipes[index];
                return recipe ? (
                  <RecipeListItem recipe={recipe} index={index} />
                ) : (
                  <></>
                );
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

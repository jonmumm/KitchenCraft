import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import {
  getProfileBySlug,
  getProfileLifetimePoints,
  getRecentRecipesByProfile,
} from "@/db/queries";
import { ProfileSlugSchema } from "@/schema";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../header";
import { RecipeListItem } from "../recipe/components";

export default async function Page(props: { params: { slug: string } }) {
  const slug = decodeURIComponent(props.params.slug);

  console.log({ slug });
  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (profileParse.success) {
    const username = profileParse.data.slice(1);

    // Fetch recent recipes by profile
    const [recipes, profile, points] = await Promise.all([
      getRecentRecipesByProfile(username),
      getProfileBySlug(username),
      getProfileLifetimePoints(username),
    ]);

    return profile ? (
      <div className="flex flex-col">
        <div className="max-w-2xl w-full mx-auto">
          <Header />
        </div>

        <div className="w-full max-w-2xl mx-auto p-4 gap-2 flex flex-col mb-8">
          <Card className="py-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-4 items-center px-4">
                <Avatar>
                  {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                  <AvatarFallback>
                    <ChefHatIcon />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 flex-1">
                  <h1 className="underline font-bold text-xl">{username}</h1>
                  <div className="flex flex-row justify-between">
                    <span className="font-medium text-sm">+{points} 🧪</span>
                    <Badge variant="outline">
                      {formatDate(profile.createdAt)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          {!profile.activated && (
            <Card className="text-primary text-sm flex flex-row gap-2 justify-between items-center py-2 px-4">
              <div className="flex flex-col gap-1">
                <h3 className="flex-1 text-sm text-muted-foreground font-semibold">
                  Not Active
                </h3>
                <p className="text-xs flex-1">
                  Your chef page is visible to you but not others.
                </p>
              </div>
              <Link href="/chefs-club">
                <Button className="whitespace-nowrap">Join Chef&apos;s Club</Button>
              </Link>
            </Card>
          )}
        </div>
        <div className="w-full flex flex-col gap-4">
          {/* Display the recipes using RecipeListItem */}
          <div className="flex flex-col gap-12">
            {recipes.map((recipe, index) => (
              <RecipeListItem key={recipe.slug} index={index} recipe={recipe} />
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div>Not Found</div>
    );
  } else {
    // console.log(profileParse.error);
  }

  return <div>Not Found</div>;
}

const formatDate = (date: Date) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = monthNames[date.getMonth()];
  const year = `'${date.getFullYear().toString().slice(-2)}`;

  return `Joined ${month} ${year}`;
};

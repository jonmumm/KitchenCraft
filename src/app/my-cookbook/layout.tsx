import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/input/dropdown-menu";
import { db } from "@/db";
import { getTagCountsForUserCreatedRecipes } from "@/db/queries";
import { getUniqueId } from "@/lib/auth/session";
import { TagsCarousel } from "@/modules/tags-carousel";
import {
  ArrowBigUpDashIcon,
  ArrowUpWideNarrowIcon,
  MessageSquareIcon,
  StarIcon,
  TagsIcon,
} from "lucide-react";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const uniqueId = await getUniqueId();
  return (
    <>
      <div className="max-w-2xl w-full mx-auto px-4 mb-8">
        <div className="flex flex-row items-center justify-between mt-6">
          <div className="flex flex-row items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground font-semibold">
              Filter
            </span>
            {/* <TagsFilter /> */}
            <RatingsFilter />
            <CommentsFilter />
            {/* <UpvotesFilter /> */}
          </div>
          <div className="flex flex-row items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground font-semibold">
              Sort
            </span>
            <SortDropdown />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}

const TagsFilter = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <TagsIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Tags</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>...</DropdownMenuItem>
        <DropdownMenuItem>...</DropdownMenuItem>
        <DropdownMenuItem>...</DropdownMenuItem>
        <DropdownMenuItem>...</DropdownMenuItem>
        <DropdownMenuItem>...</DropdownMenuItem>
        <DropdownMenuItem>...</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UpvotesFilter = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <ArrowBigUpDashIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Ratings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>No Rating</DropdownMenuItem>
        <DropdownMenuItem>
          <Button variant="outline" size="icon">
            <ArrowBigUpDashIcon />
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Button variant="outline" size="icon">
            <ArrowBigUpDashIcon />
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const RatingsFilter = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <StarIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Min Rating</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value="none">
          <DropdownMenuRadioItem value={"5"}>
            <Rating value={5} />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={"4"}>
            <Rating value={4} />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={"3"}>
            <Rating value={3} />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={"2"}>
            <Rating value={2} />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={"1"}>
            <Rating value={1} />
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CommentsFilter = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MessageSquareIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Has Comments</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup>
          <DropdownMenuRadioItem value="Yes">Yes</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="No">No</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SortDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <ArrowUpWideNarrowIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Sort</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={"most_recent"}>
          <DropdownMenuRadioItem value={"most_recent"}>
            Recent
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={"most_votes"}>
            Votes
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={"most_comments"}>
            Comments
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Rating = ({ value }: { value: number }) => {
  return (
    <div className="flex flex-row">
      {[1, 2, 3, 4, 5].map((current) => (
        <StarIcon
          key={value}
          className={`mask mask-star-2 ${
            current <= value ? `bg-green-500` : ``
          }`}
        />
      ))}
    </div>
  );
};

"use client";

import { Button } from "@/components/input/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/input/dropdown-menu";
import { createRecipeLinkSelector } from "@/selectors/page-session.selectors";
import { MoreVerticalIcon } from "lucide-react";
import { useMemo } from "react";
import { PageSessionSelectorLink } from "./util/page-session-selector-link";

export const RecipeMoreDropdownButton = ({
  id,
}: {
  id: string | undefined;
}) => {
  const selectRecipeLink = useMemo(() => createRecipeLinkSelector(id), [id]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mr-2 z-100">
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-muted-foreground">
            <PageSessionSelectorLink
              target="_blank"
              selector={selectRecipeLink}
            >
              {/* <EventTrigger event={{type: "ADD_TO_LIST"}}>  */}
              <span role="img" aria-label="open-in-new-tab" className="mr-2">
                ➕
              </span>
              <span className="text-muted-foreground">Open in </span>
              <span className="text-foreground font-semibold">New Tab</span>
            </PageSessionSelectorLink>
            {/* </EventTrigger> */}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <div>
              <span role="img" aria-label="add-to-favorites" className="mr-2">
                🖨️
              </span>
              <span className="text-foreground font-semibold">Print </span>
              <span className="text-foreground-muted">this Recipe</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <div>
              <span role="img" aria-label="modify-recipe" className="mr-2">
                ✏️
              </span>
              <span className="font-semibold text-foreground">Edit </span>
              <span className="text-foreground-muted">this Recipe</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <div>
              <span role="img" aria-label="add-to-new-list" className="mr-2">
                #️⃣
              </span>
              <span className="text-muted-foreground">Save to </span>{" "}
              <span className="text-foreground font-semibold">New List</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <div>
              {/* <EventTrigger event={{type: "ADD_TO_LIST"}}>  */}
              <span role="img" aria-label="add-to-make-later" className="mr-2">
                ⏰
              </span>
              <span className="text-muted-foreground">Save to </span>
              <span className="text-foreground font-semibold">Make Later</span>
            </div>
            {/* </EventTrigger> */}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <div>
              <span role="img" aria-label="add-to-favorites" className="mr-2">
                ❤️
              </span>
              <span className="text-muted-foreground">Save to </span>{" "}
              <span className="text-foreground font-semibold">Favorites</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

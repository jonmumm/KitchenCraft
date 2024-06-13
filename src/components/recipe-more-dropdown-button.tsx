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
import { MoreVerticalIcon } from "lucide-react";

export const RecipeMoreDropdownButton = () => {
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
            <div>
              {/* <EventTrigger event={{type: "ADD_TO_LIST"}}>  */}
              <span role="img" aria-label="open-in-new-tab" className="mr-2">
                ➕
              </span>
              <span className="text-muted-foreground">Open in </span>
              <span className="text-foreground font-semibold">New Tab</span>
            </div>
            {/* </EventTrigger> */}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <div>
              {/* <EventTrigger event={{type: "ADD_TO_LIST"}}>  */}
              <span role="img" aria-label="add-to-make-later" className="mr-2">
                ⏰
              </span>
              <span className="text-muted-foreground">Add to </span>
              <span className="text-foreground font-semibold">Make Later</span>
            </div>
            {/* </EventTrigger> */}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <div>
              <span role="img" aria-label="add-to-new-list" className="mr-2">
                📜
              </span>
              <span className="text-muted-foreground">Add to </span>{" "}
              <span className="text-foreground font-semibold">New List</span>
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

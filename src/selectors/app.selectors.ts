// todo put all client selectors here

import { AppSnapshot } from "@/app/app-machine";

export const selectCraftIsOpen = (state: AppSnapshot) =>
  state.matches({ Open: "True" });

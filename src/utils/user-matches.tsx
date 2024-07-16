"use client";

import type { UserState } from "@/app/user-machine";
import { matchesState, StateValue } from "xstate";

export function userMatchesState(
  stateValue: UserState,
  state: StateValue
): boolean {
  return matchesState(stateValue, state);
}

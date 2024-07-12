"use client";

import type { UserState } from "@/app/user-machine";
import type { DeepPartial } from "@/lib/types";
import { matchesState, StateValue } from "xstate";

export function userMatchesState(
  stateValue: DeepPartial<UserState>,
  state: StateValue
): boolean {
  return matchesState(stateValue, state);
}

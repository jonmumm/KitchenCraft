import type { PageSessionSnapshot } from "@/app/page-session-machine";
import type { UserState } from "@/app/user-machine";
import { ReadableAtom } from "nanostores";
import { userMatchesState } from "./user-matches";

export function waitForUserMatches(
  matchedState: UserState,
  store: ReadableAtom<PageSessionSnapshot>
): Promise<void> {
  return new Promise((resolve) => {
    const checkState = () => {
      const value = store.get().context.userSnapshot?.value;
      if (value && userMatchesState(matchedState, value)) {
        resolve();
      } else {
        store.listen(checkState);
      }
    };

    checkState();
  });
}

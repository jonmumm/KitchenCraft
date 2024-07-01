"uset client";

import { sessionMatchesComponent } from "@/components/util/session-matches";

export const IsLoggedIn = sessionMatchesComponent({
  Auth: "Authenticated",
});

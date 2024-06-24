"use client";

import { userMatchesComponent } from "../util/user-matches";

export const HasClaimedProfileName = userMatchesComponent({
  ProfileName: { Claimed: "True" },
});

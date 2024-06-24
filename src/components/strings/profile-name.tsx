"use client";

import { selectProfileName } from "@/selectors/page-session.selectors";
import { pageSessionSelectorStringComponent } from "../util/page-session-selector-string";

export const ProfileName =
  pageSessionSelectorStringComponent(selectProfileName);

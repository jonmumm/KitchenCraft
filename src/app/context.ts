"use client";

import { User } from "@/types";
import { createContext } from "react";

export const UserContext = createContext(
  {} as {
    user: User | null;
    signOut: () => Promise<void>;
    signIn: () => Promise<void>;
  }
);

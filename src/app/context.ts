"use client";

import { User } from "@/types";
import { createContext } from "react";

export const UserContext = createContext(
  {} as {
    user: User | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
  }
);

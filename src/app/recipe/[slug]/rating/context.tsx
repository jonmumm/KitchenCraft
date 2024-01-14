import { atom } from "nanostores";
import { createContext } from "react";
import { RatingValue } from "./types";

export const RatingContext = createContext({
  open$: atom<boolean>(false),
  rating$: atom<RatingValue>(0),
});

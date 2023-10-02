import { map } from "nanostores";

export const prompt$ = map({
  focused: false,
  text: "",
  selection: null as { name: string; description: string } | null,
});

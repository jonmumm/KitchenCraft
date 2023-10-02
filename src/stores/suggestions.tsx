import { map } from "nanostores";

export const suggestions$ = map({
  loading: false,
  data: [] as {
    name: string;
    description: string;
  }[],
});

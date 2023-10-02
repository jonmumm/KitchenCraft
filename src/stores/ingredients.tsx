import { map } from "nanostores";

type IngedientData = {
  name: string;
  src: "prompt" | "manual";
};

export const ingredients$ = map({
  loading: false,
  data: [] as IngedientData[],
});

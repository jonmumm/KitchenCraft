import { deepMap, map } from "nanostores";

export const store = deepMap({
  loading: false,
  index: 0,
  prompt: undefined as string | undefined,
  history: [] as { question: string; answer: string }[],
  inputRef: { current: null as HTMLInputElement | null },
});

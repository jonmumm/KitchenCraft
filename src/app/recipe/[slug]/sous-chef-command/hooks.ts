import { useStore } from "@nanostores/react";
import { store } from "./store";

export const usePrompt = () => {
  const { prompt } = useStore(store, { keys: ["prompt"] });
  return prompt;
};

export const useLoading = () => {
  const { loading } = useStore(store, { keys: ["loading"] });
  return loading;
};

export const useData = () => {
  const { data } = useStore(store, { keys: ["data"] });
  return data;
};

export const useDirty = () => {
  const { prompt, submittedPrompt } = useStore(store, {
    keys: ["prompt", "submittedPrompt"],
  });
  return prompt !== submittedPrompt;
};

import { useStore } from "@nanostores/react";
import { computed } from "nanostores";
import { useState } from "react";
import { store } from "./store";

export const usePrompt = () => {
  const { prompt } = useStore(store, { keys: ["prompt"] });
  return prompt;
};

export const useLoading = () => {
  const { loading } = useStore(store, { keys: ["loading"] });
  return loading;
};

export const useDirty = () => {
  const [dirty$] = useState(
    computed(store, ({ prompt, history, index, loading }) => {
      if (loading) {
        return false;
      }

      return prompt !== history[index - 1]?.question;
    })
  );
  return useStore(dirty$);
};

export const useCurrentAnswer = () => {
  const [answer$] = useState(
    computed(store, ({ history, index }) => history[index - 1]?.answer)
  );
  return useStore(answer$);
};

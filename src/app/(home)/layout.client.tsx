"use client";

import { Tabs } from "@/components/navigation/tabs";
import { useStore } from "@nanostores/react";
import { map } from "nanostores";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { HomeContext } from "./context";
import { TabSchema, TimeParamSchema } from "./schema";
import { HomeStore } from "./types";

export default function LayoutClient(props: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segment = pathname.split("/")[1];
  const parseResult = TabSchema.safeParse(segment);
  const tab = parseResult.success ? parseResult.data : "hot";

  const [store] = useState<HomeStore>(
    map({
      tab,
      timeParam: searchParams.get("t"),
    })
  );

  // const handleUpvote = useCallback(
  //   (event: UpvoteEvent) => {
  //     props.upvote(event.slug).then(noop);
  //   },
  //   [props.upvote]
  // );

  // useEventHandler("UPVOTE", handleUpvote);

  const SearchParams = () => {
    const searchParams = useSearchParams();
    searchParams.get("t");
    const timeParam = TimeParamSchema.parse(searchParams.get("t") || "month");

    useEffect(() => {
      store.setKey("timeParam", timeParam);
    }, [timeParam]);

    return null;
  };
  return (
    <>
      <HomeContext.Provider value={store}>
        <SearchParams />
        {props.children}
      </HomeContext.Provider>
    </>
  );
}

export const HomeTabs = ({ children }: { children: ReactNode }) => {
  const store = useContext(HomeContext);
  const { tab } = useStore(store, { keys: ["tab"] });

  const handleTabChange = useCallback(
    (value: string) => {
      store.setKey("tab", TabSchema.parse(value));
    },
    [store]
  );

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      {children}
    </Tabs>
  );
};

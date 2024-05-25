"use client";

import { PageSessionSnapshot } from "@/app/page-session-machine";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";

const selectNumItemsInList = (snapshot: PageSessionSnapshot) => {
  return (
    snapshot.context.browserSessionSnapshot?.context.currentListRecipeIds
      .length || 0
  );
};

export const ListIndicator = () => {
  const numItemsInList = usePageSessionSelector(selectNumItemsInList);

  return (
    <>
      {numItemsInList !== 0 && (
        <span className="indicator-item badge badge-neutral p-1 text-xs">
          {numItemsInList}
        </span>
      )}
    </>
  );
};

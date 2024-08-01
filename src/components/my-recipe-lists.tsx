"use client";

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { useRecipeListBySlug } from "@/hooks/useRecipeListBySlug";
import {
  createListByIdSelector,
  selectRecentCreatedListIds
} from "@/selectors/page-session.selectors";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import { twc } from "react-twc";
import { Card } from "./display/card";
import { Separator } from "./display/separator";
import { Skeleton } from "./display/skeleton";

export const MyRecipeLists = () => {
  const recentCreatedListIds = usePageSessionSelector(
    selectRecentCreatedListIds
  );
  const numEmpty = recentCreatedListIds
    ? Math.max(3 - recentCreatedListIds.length, 0)
    : 3;

  return (
    <div className="relative h-24">
      <div className="absolute top-0 w-screen left-1/2 transform -translate-x-1/2 z-10 flex flex-row justify-center">
        <div className="carousel carousel-center pl-2 pr-2 space-x-2">
          {recentCreatedListIds &&
            recentCreatedListIds
              .filter((_, idx) => idx < 3)
              .map((listId) => {
                return <MyRecipeListCardById id={listId} key={listId} />;
              })}
          <MyRecipeListCardBySlug slug="liked" />
          <MyRecipeListCardBySlug slug="make-later" />
          <MyRecipeListCardBySlug slug="favorites" />
          <Separator orientation="vertical" />
          <MyRecipeListItemCard
            event={{ type: "CREATE_LIST" }}
            variant="locontrast"
          >
            <MyRecipeListItemContent>
              <span className="text-lg">➕</span>
              <MyRecipeListItemTitle>Create</MyRecipeListItemTitle>
              <MyRecipeListItemRecipeCount>
                New List
              </MyRecipeListItemRecipeCount>
            </MyRecipeListItemContent>
          </MyRecipeListItemCard>
          {new Array(numEmpty).fill(0).map((items, index) => {
            return (
              <MyRecipeListItemCard variant="locontrast" key={index}>
                <MyRecipeListItemContent>
                  <span className="text-lg opacity-0">∅</span>
                  <MyRecipeListItemTitle className="text-muted-foreground">
                    Empty
                  </MyRecipeListItemTitle>
                  <Skeleton className="w-10 h-3 animate-none dark:bg-slate-600" />
                </MyRecipeListItemContent>
              </MyRecipeListItemCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MyRecipeListItemContent = twc.div`flex flex-col gap-1 px-3 w-[7.5rem] items-start`;
const MyRecipeListItemTitle = twc.h4`font-semibold truncate max-w-full`;
const MyRecipeListItemRecipeCount = twc.div`text-muted-foreground`;
const MyRecipeListItemCard = twc(
  Card
)`carousel-item max-w-24 h-24 flex flex-row gap-2 justify-start items-center cursor-pointer hover:bg-slate-100 active:bg-slate-300 dark:hover:bg-slate-900 dark:active:bg-slate-700`;

const MyRecipeListCardById = ({ id }: { id: string }) => {
  const selectList = useMemo(() => createListByIdSelector(id), [id]);
  const list = usePageSessionSelector(selectList);

  return (
    <Link href={`#${list?.slug}`}>
      <MyRecipeListItemCard variant="locontrast">
        <MyRecipeListItemContent>
          <span className="text-lg">
            {list?.icon ? <>{list.icon}</> : <>&nbsp;</>}
          </span>
          <MyRecipeListItemTitle>
            {list?.slug ? <>{list.slug}</> : <Skeleton className="w-12 h-4" />}
          </MyRecipeListItemTitle>
          <MyRecipeListItemRecipeCount>
            {list?.count !== undefined ? (
              <>
                {list?.count} {list?.count === 1 ? "recipe" : "recipes"}
              </>
            ) : (
              <Skeleton className="w-10 h-3 animate-none dark:bg-slate-600" />
            )}
          </MyRecipeListItemRecipeCount>
        </MyRecipeListItemContent>
      </MyRecipeListItemCard>
    </Link>
  );
};

const MyRecipeListCardBySlug = ({ slug }: { slug: string }) => {
  const list = useRecipeListBySlug(slug);
  const t = useTranslations("General");

  return (
    <Link href={`#${slug}`}>
      <MyRecipeListItemCard variant="locontrast">
        <MyRecipeListItemContent>
          <span className="text-lg">
            {list?.icon ? <>{list.icon}</> : <>&nbsp;</>}
          </span>
          <MyRecipeListItemTitle>
            #{list?.slug ? <>{list.slug}</> : <Skeleton className="w-12 h-4" />}
          </MyRecipeListItemTitle>
          <MyRecipeListItemRecipeCount>
            {list?.count !== undefined ? (
              <>{t("recipeCount", { count: list?.count })}</>
            ) : (
              <Skeleton className="w-10 h-3 animate-none dark:bg-slate-600" />
            )}
          </MyRecipeListItemRecipeCount>
        </MyRecipeListItemContent>
      </MyRecipeListItemCard>
    </Link>
  );
};

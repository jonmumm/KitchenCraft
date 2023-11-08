import { waitForStoreValue } from "@/lib/utils";
import { MapStore } from "nanostores";
import { StoreProps } from "./schema";

export async function Yield({ store }: { store: MapStore<StoreProps> }) {
  const recipeYield = await waitForStoreValue(store, (state) => {
    if (state.recipe.activeTime && state.recipe.yield) {
      return state.recipe.yield;
    }
  });
  return <>{recipeYield}</>;
}

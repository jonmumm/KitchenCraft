import { waitForStoreValue } from "@/lib/utils";
import { MapStore } from "nanostores";
import { ReactNode } from "react";

interface Props<TStoreProps extends object> {
  children: ReactNode;
  store: MapStore<TStoreProps>;
  selector: (state: ReturnType<MapStore<TStoreProps>["get"]>) => any;
}

export async function WaitForStore<TStoreProps extends object>({
  children,
  store,
  selector,
}: Props<TStoreProps>) {
  await waitForStoreValue(store, selector);
  return <>{children}</>;
}

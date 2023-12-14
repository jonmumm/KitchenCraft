import { Tabs, TabsList, TabsTrigger } from "@/components/navigation/tabs";
import { ReactNode } from "react";

export const FooterTabs = ({ children }: { children: ReactNode }) => {
  //   const store = useContext(HomeContext);
  //   const { tab } = useStore(store, { keys: ["tab"] });

  //   const handleTabChange = useCallback(
  //     (value: string) => {
  //       store.setKey("tab", TabSchema.parse(value));
  //     },
  //     [store]
  //   );

  return (
    <Tabs>
      <TabsTrigger value={"hello"}></TabsTrigger>
      <TabsList></TabsList>
    </Tabs>
  );
};

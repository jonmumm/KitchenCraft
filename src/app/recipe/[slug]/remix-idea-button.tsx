import { Button } from "@/components/input/button";
import { ReactNode, useCallback } from "react";

export const RemixIdeaButton = ({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) => {
  // set the form state....
  const handlePress = useCallback(() => {}, []);
  return (
    <Button
      onClick={handlePress}
      className="flex flex-row gap-3 items-center justify-between w-full p-3"
    >
      {children}
    </Button>
  );
};

import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { selectSelectedRecipeCount } from "@/selectors/page-session.selectors";

export const CurrentListCount = () => {
  const count = usePageSessionSelector(selectSelectedRecipeCount);
  return <>{count}</>;
};

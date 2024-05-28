import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { selectCurrentListCount } from "@/selectors/page-session.selectors";

export const CurrentListCount = () => {
  const count = usePageSessionSelector(selectCurrentListCount);
  return <>{count}</>;
};

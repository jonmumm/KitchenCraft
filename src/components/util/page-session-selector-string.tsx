import { PageSessionSnapshot } from "@/app/page-session-machine";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";

interface PageSessionSelectorStringProps {
  selector: (snapshot: PageSessionSnapshot) => string | undefined;
  fallback?: string;
}
export const PageSessionSelectorString = (
  props: PageSessionSelectorStringProps
) => {
  const selectedValue = usePageSessionSelector(props.selector);
  return <>{selectedValue || props.fallback || ""}</>;
};

// New pageSessionSelectorStringComponent
export const pageSessionSelectorStringComponent = (
  selector: (snapshot: PageSessionSnapshot) => string | undefined
) => {
  const Component = ({ fallback }: { fallback?: string }) => (
    <PageSessionSelectorString selector={selector} fallback={fallback} />
  );
  Component.displayName = `PageSessionSelectorStringComponent(${selector.toString()})`;
  return Component;
};

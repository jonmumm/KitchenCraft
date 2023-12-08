import { ReactNode, Suspense } from "react";
import { Observable } from "rxjs";
import { RenderFirstValue } from "./render-first-value";

type AsyncRenderFirstValueProps<T> = {
  render: (value: T) => ReactNode;
  observable: Observable<T>;
  fallback: ReactNode;
};

export const AsyncRenderFirstValue = <T,>({
  render,
  observable,
  fallback,
}: AsyncRenderFirstValueProps<T>) => {
  const AsyncComponent = async () => {
    return <RenderFirstValue observable={observable} render={render} />;
  };

  return (
    <Suspense fallback={fallback}>
      <AsyncComponent />
    </Suspense>
  );
};

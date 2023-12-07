import { ReactNode, Suspense } from "react";
import { Observable } from "rxjs";
import { RenderFirstValue } from "./render-first-value";

type AsyncRenderLastValueProps<T> = {
  render: (value: T) => ReactNode;
  observable: Observable<T>;
  fallback: ReactNode;
};

export const AsyncRenderLastValue = <T,>({
  render,
  observable,
  fallback,
}: AsyncRenderLastValueProps<T>) => {
  const AsyncComponent = async () => {
    return <RenderFirstValue observable={observable} render={render} />;
  };

  return (
    <Suspense fallback={fallback}>
      <AsyncComponent />
    </Suspense>
  );
};

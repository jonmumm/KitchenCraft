import { ReactNode } from "react";
import { Observable, lastValueFrom } from "rxjs";

type RenderFirstValueProps<T> = {
  render: (value: T) => ReactNode;
  observable: Observable<T>;
};

export const RenderFirstValue = async <T,>({
  render,
  observable,
}: RenderFirstValueProps<T>) => {
  const value = await lastValueFrom(observable);
  return <>{render(value)}</>;
};

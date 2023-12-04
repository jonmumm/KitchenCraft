import { ReactNode } from "react";
import { Observable, lastValueFrom } from "rxjs";

type RenderLastValueProps<T> = {
  render: (value: T) => ReactNode;
  observable: Observable<T>;
};

export const RenderLastValue = async <T,>({
  render,
  observable,
}: RenderLastValueProps<T>) => {
  const value = await lastValueFrom(observable);
  return <>{render(value)}</>;
};

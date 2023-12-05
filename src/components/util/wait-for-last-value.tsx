import { ReactNode } from "react";
import { Observable, identity, lastValueFrom } from "rxjs";

export const WaitForLastValue = async ({
  children,
  observable,
}: {
  children: ReactNode;
  observable: Observable<any>;
}) => {
  await lastValueFrom(observable.pipe(identity));
  return <>{children}</>;
};

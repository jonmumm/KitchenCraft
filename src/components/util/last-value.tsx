import { Observable, lastValueFrom } from "rxjs";

export async function LastValue({
  observable,
}: {
  observable: Observable<string>;
}) {
  const value = await lastValueFrom(observable);
  return <>{value}</>;
}

import { Observable, firstValueFrom } from "rxjs";

export async function FirstValue({
  observable,
}: {
  observable: Observable<string>;
}) {
  const value = await firstValueFrom(observable);
  return <>{value}</>;
}

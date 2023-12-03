import { Observable, defaultIfEmpty, defer, first, map } from "rxjs";

export function getObservableAtIndex<T>(
  index: number,
  observable: Observable<T[]>
) {
  return defer(() =>
    observable.pipe(
      map((items) => {
        if (index >= 0 && index < items.length) {
          return items[index];
        }
        return undefined;
      })
    )
  );
}

export function getTokenObservableAtIndex<T>(
  tokenIndex: number,
  itemIndex: number,
  items$: Observable<string[]>
) {
  return defer(() => {
    const item$ = getObservableAtIndex(itemIndex, items$);

    return item$.pipe(
      map((item) => {
        const tokens = item?.split(" ") || [];
        const token = tokens[tokenIndex];
        return token;
      }),
    );
  });
}

// const token = await lastValueFrom(
//   instructions$.pipe(
//     map((items) => items[itemIndex]?.split(" ")?.[index]),
//     takeWhile((items) => {
//       const tokens = items?.[itemIndex]?.split(" ");
//       const nextItemExists = !!items?.[itemIndex + 1];
//       const nextTokenExists = !!tokens?.[index + 1];
//       return !nextItemExists && !nextTokenExists;
//     }, true)
//   )
// );

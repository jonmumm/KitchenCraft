export function hasSlug(item: any): item is { slug: string } {
  return !!item && typeof item.slug === "string";
}

export function notUndefined<T extends any>(item: T | undefined): item is T {
  return item !== undefined;
}

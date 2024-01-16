import { ObservableType } from "@/types";
import { cache } from "react";
import { ReplaySubject } from "rxjs";

export const galleryInput = cache(
  () =>
    new ReplaySubject<
      Partial<{
        open: boolean;
        currentSlug: string | undefined;
      }>
    >(1)
);

export type GalleryInput = ObservableType<ReturnType<typeof galleryInput>>;

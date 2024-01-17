import { createSelector } from "reselect";
import { MediaGallerySnapshot } from "./machine";

export const selectIsFullscreen = (state: MediaGallerySnapshot) => {
  return state.matches("Fullscreen.True");
};

export const selectContext = (state: MediaGallerySnapshot) => {
  return state.context;
};

export const selectImageHeight = createSelector(
  selectIsFullscreen,
  selectContext,
  (fullscreen, context) => (fullscreen ? `100svh` : context.minHeight)
);

import { createSelector } from "reselect";
import { MediaGallerySnapshot } from "./machine";

export const selectIsFullscreen = (state: MediaGallerySnapshot) => {
  return state.matches("Fullscreen.True");
};

export const selectImageHeight = createSelector(
  selectIsFullscreen,
  (fullscreen) => (fullscreen ? `80svh` : `50svh`)
);

import { GalleryDialog } from "./components.client";

export async function Gallery() {
  return (
    <>
      <GalleryDialog open={false}>Hello!</GalleryDialog>
    </>
  );
}

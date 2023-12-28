import { ImageResponse } from "@vercel/og";
import { getRecipe } from "./utils";
import { UploadedMedia } from "./media/types";
import { UploadedMediaSchema } from "./media/schema";
import { kv } from "@/lib/kv";
import { getFirstMediaForRecipe } from "@/db/queries";

// Image metadata
// export const alt = "About Acme";

// Route segment config
export const runtime = "edge";

export const name = "HELLO!";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image(props: { params: { slug: string } }) {
  // const recipe = await getRecipe(props.params.slug);
  // Font
  //   const interSemiBold = fetch(
  //     new URL("./Inter-SemiBold.ttf", import.meta.url)
  //   ).then((res) => res.arrayBuffer());

  // const mainMediaId = recipe.previewMediaIds[0];
  // let mainMedia: UploadedMedia | undefined;
  // if (mainMediaId) {
  //   console.log({ mainMediaId });
  //   mainMedia = UploadedMediaSchema.parse(
  //     await kv.hgetall(`media:${mainMediaId}`)
  //   );
  // }

  const [recipe, mainMedia] = await Promise.all([
    getRecipe(props.params.slug),
    getFirstMediaForRecipe(props.params.slug),
  ]);

  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: "44px",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {mainMedia && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            style={{
              width: "100%",
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            src={mainMedia.url}
            alt=""
          />
        )}

        <div
          style={{
            padding: "35px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h1
            style={{
              width: "100%",
              color: "white",
            }}
          >
            {recipe.name}
          </h1>
          <p style={{ color: "white" }}>{recipe.description}</p>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
      //   fonts: [
      //     {
      //       name: "Inter",
      //       data: await interSemiBold,
      //       style: "normal",
      //       weight: 400,
      //     },
      //   ],
    }
  );
}

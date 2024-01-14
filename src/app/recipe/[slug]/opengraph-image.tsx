import { getFirstMediaForRecipe, getRecipe } from "@/db/queries";
import { assert } from "@/lib/utils";
import { ImageResponse } from "@vercel/og";

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
  const interSemiBold = fetch(
    new URL("./Inter-SemiBold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

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
  assert(recipe, "expected recipe");
  // const { renderToStaticMarkup } = await import("react-dom/server");
  // const { twj } = tailwindToCSS({
  //   config: (await import("../../../../tailwind.config"))
  //     .default as TailwindConfig,
  // });

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
          backgroundColor: "#fff",
          borderBottom: "15px solid purple",
        }}
      >
        <div
          style={{
            padding: "35px",
            display: "flex",
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flexWrap: "wrap",
                flex: 1,
              }}
            >
              <h1
                style={{
                  color: "black",
                  margin: 0,
                  padding: 0,
                  fontSize: "64px",
                }}
              >
                {recipe.name}{" "}
              </h1>
              <h3
                style={{
                  margin: 0,
                  marginTop: "18px",
                  padding: 0,
                  fontSize: "48px",
                  fontWeight: "normal",
                  color: "#334155", // slate 700
                }}
              >
                {recipe.createdBySlug ? (
                  <>
                    <span style={{ fontWeight: "bold" }}>
                      @{recipe.createdBySlug}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: "bold" }}>@ChefAnonymous</span>
                  </>
                )}
              </h3>
            </div>
            {mainMedia && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                style={{
                  maxWidth: "20%",
                  borderRadius: "30px",
                }}
                src={mainMedia.url}
                alt=""
              />
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "center",
              padding: "0px 10px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "20px",
                padding: "10px 30px",
                // minWidth: 0,
                maxWidth: "100%",
                border: "2px solid hsl(220 8.9% 46.1%)",
                borderRadius: "35px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9" />
                <path d="M15 13 9 7l4-4 6 6h3a8 8 0 0 1-7 7z" />
              </svg>

              <p
                style={{
                  color: "#334155", // Slate 800
                  fontWeight: "normal",
                  padding: 0,
                  margin: 0,
                  fontSize: "30px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  textOverflow: "ellipsis",
                }}
              >
                &apos;
                {recipe.prompt}
                &apos;
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
      fonts: [
        {
          name: "Inter",
          data: await interSemiBold,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}

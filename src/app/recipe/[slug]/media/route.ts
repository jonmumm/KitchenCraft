import { assert } from "@/lib/utils";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { kv } from "@vercel/kv";
import { nanoid } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  BaseMediaSchema,
  MediaMetadataSchema,
  TokenPayloadSchema,
  UploadedMediaSchema,
} from "./schema";
import { TokenPayload } from "./types";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
        clientPayload?: string
      ) => {
        assert(clientPayload, "expected clientPayload");
        const id = nanoid();
        const metadata = MediaMetadataSchema.parse(JSON.parse(clientPayload));
        const media = {
          id,
          pathname,
          uploadStatus: "created",
          metadata,
        } satisfies z.infer<typeof BaseMediaSchema>;
        kv.hset(`media:${id}`, media);

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif"],
          tokenPayload: JSON.stringify({
            mediaId: id,
          } satisfies TokenPayload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        assert(tokenPayload, "expected tokenPayload");
        const { mediaId } = TokenPayloadSchema.parse(JSON.parse(tokenPayload));

        const data = BaseMediaSchema.parse(
          await kv.hgetall(`media:${mediaId}`)
        );

        const media = {
          ...data,
          uploadStatus: "complete",
          ...blob,
        } satisfies z.infer<typeof UploadedMediaSchema>;

        try {
          const multi = kv.multi();
          multi.hset(`media:${mediaId}`, media);
          multi.lpush(`recipe:${params.slug}:media`, mediaId);
          const previewMediaIds = z
            .array(z.string())
            .parse(
              (await kv.hget(`recipe:${params.slug}`, "previewMediaIds")) || []
            );
          multi.hincrby(`recipe:${params.slug}`, "mediaCount", 1);

          multi.hset(`recipe:${params.slug}`, {
            previewMediaIds: [...previewMediaIds, mediaId].slice(0, 5),
          });

          multi.exec();

          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });
        } catch (error) {
          console.error(error);
          throw new Error("Could not update media");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}

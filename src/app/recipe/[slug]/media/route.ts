import { db, MediaTable } from "@/db";
import { createRecipeMedia } from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { assert } from "@/lib/utils";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import {
  BaseMediaSchema,
  MediaMetadataSchema,
  TokenPayloadSchema,
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
        const session = await getSession();
        const userId = session?.user.id;
        assert(userId, "expected userId when uploading media");

        assert(clientPayload, "expected clientPayload");
        const id = randomUUID();
        const metadata = MediaMetadataSchema.parse(JSON.parse(clientPayload));
        const media = {
          id,
          pathname,
          uploadStatus: "created",
          metadata,
          userId,
        } satisfies z.infer<typeof BaseMediaSchema>;
        // kv.hset(`media:${id}`, media);
        kv.set(`media:${id}`, media, { ex: 60 * 300 });

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
        const mediaJSON = await kv.get(`media:${mediaId}`);
        const media = BaseMediaSchema.parse(mediaJSON);

        const imgResponse = await fetch(blob.url);
        if (!imgResponse.ok) {
          throw new Error(
            `Failed to fetch ${blob.url}: ${imgResponse.statusText}`
          );
        }
        const blobData = await imgResponse.blob();
        const buffer = Buffer.from(await blobData.arrayBuffer());

        let processedImage: Buffer;
        try {
          processedImage = await sharp(buffer)
            .resize(10, 10) // Resize to a very small image
            .blur() // Optional: add a blur effect
            .toBuffer();
        } catch (ex) {
          console.error(ex);
          throw ex;
        }
        const base64Image = processedImage.toString("base64");

        // Start a transaction
        await db.transaction(async (transaction) => {
          const newMediaId = randomUUID();
          try {
            const sourceType = "UPLOAD";
            await transaction.insert(MediaTable).values({
              id: newMediaId,
              createdBy: media.userId,
              mediaType: media.metadata.type,
              contentType: blob.contentType,
              sourceType,
              height: media.metadata.height,
              url: blob.url,
              width: media.metadata.width,
              blurDataURL: base64Image,
              duration: undefined,
            });
          } catch (error) {
            console.error(error);
            return;
          }

          try {
            await createRecipeMedia(transaction, params.slug, newMediaId);
          } catch (error) {
            console.error(error);
            return;
          }
        });

        await kv.del(`media:${mediaId}`);
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

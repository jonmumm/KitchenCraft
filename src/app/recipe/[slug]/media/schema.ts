import { z } from "zod";

// Define the schema for common media information

export const ImageMetadataSchema = z.object({
  type: z.literal("IMAGE"),
  width: z.number(),
  height: z.number(),
});

export const VideoMetadataSchema = z.object({
  type: z.literal("VIDEO"),
  width: z.number(),
  height: z.number(),
  duration: z.number(),
});

export const MediaMetadataSchema = z.discriminatedUnion("type", [
  ImageMetadataSchema,
  VideoMetadataSchema,
]);

export const BaseMediaSchema = z.object({
  id: z.string(),
  pathname: z.string(),
  uploadStatus: z.literal("created"),
  metadata: MediaMetadataSchema,
});

export const UploadedMediaSchema = BaseMediaSchema.merge(
  z.object({
    url: z.string(),
    uploadStatus: z.literal("complete"),
  })
);

export const TokenPayloadSchema = z.object({
  mediaId: z.string(),
});

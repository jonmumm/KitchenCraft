import { z } from "zod";
import { TokenPayloadSchema, UploadedMediaSchema } from "./schema";

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type UploadedMedia = z.infer<typeof UploadedMediaSchema>;

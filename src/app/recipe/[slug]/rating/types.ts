import { z } from "zod";
import { RatingValueSchema } from "./schema";

export type RatingValue = z.infer<typeof RatingValueSchema>;
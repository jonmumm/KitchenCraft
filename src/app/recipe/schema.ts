import { z } from "zod";

export const SlugScorePairSchema = z.tuple([z.string(), z.number()]);

export const SlugScoreArraySchema = z
  .array(SlugScorePairSchema)
  .refine((data) => data.length % 2 === 0, {
    message: "Array length must be even",
  });

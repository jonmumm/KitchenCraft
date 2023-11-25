import { z } from "zod";

export const CulinaryClubSchema = z.object({
  slug: z.string(),
  payingUserId: z.string(),
  members: z.array(z.string()),
  status: z.enum(["active", "paused", "archived"]),
});

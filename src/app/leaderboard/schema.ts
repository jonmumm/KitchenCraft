import { z } from "zod";

export const LeaderboardTabNameSchema = z
  .enum(["today", "week", "month", "season", "year", "all"])
  .default("season");

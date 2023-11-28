import { z } from "zod";

export const TabSchema = z.enum(["hot", "recent", "best"]);
export const TimeParamSchema = z.enum([
  "today",
  "week",
  "month",
  "year",
  "all",
]);

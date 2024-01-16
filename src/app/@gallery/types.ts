import { z } from "zod";
import { ContextSchema } from "./schema";

export type Context = z.infer<typeof ContextSchema>;

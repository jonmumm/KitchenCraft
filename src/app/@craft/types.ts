import { ActorRefFrom, SnapshotFrom } from "xstate";
import { z } from "zod";
import { createCraftMachine } from "./machine";
import { ContextSchema } from "./schemas";
import { GeneratorObervableEvent } from "@/lib/generator";
import {
  IdeasPredictionOutput,
  SubstitutionsPredictionOutput,
  SuggestionPredictionOutput,
} from "@/types";

export type CraftMachine = ReturnType<typeof createCraftMachine>;
export type CraftActor = ActorRefFrom<CraftMachine>;
export type CraftSnapshot = SnapshotFrom<CraftActor>;
export type Context = z.infer<typeof ContextSchema>;

export type GeneratorEvent =
  | GeneratorObervableEvent<"EQUIPMENT_ADAPTATIONS", IdeasPredictionOutput>
  | GeneratorObervableEvent<"DIETARY_ALTERNATIVES", IdeasPredictionOutput>
  | GeneratorObervableEvent<"SUBSTITUTIONS", SubstitutionsPredictionOutput>
  | GeneratorObervableEvent<"SUGGESTION", SuggestionPredictionOutput>;

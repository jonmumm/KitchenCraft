import Generator from "@/components/ai/generator";
import { RecipePredictionOutputSchema } from "@/schema";
import {
  RecipePredictionInput,
  RecipePredictionOutput,
  RecipePredictionPartialOutput,
} from "@/types";
import { z } from "zod";
import { RecipeTokenStream } from "./stream";

type Props = {
  input: RecipePredictionInput;
  onStart?: () => void;
  onError?: (error: Error, outputRaw: string) => void;
  onProgress?: (output: RecipePredictionPartialOutput) => void;
  onComplete?: (output: RecipePredictionOutput) => void;
};

export default async function RecipeGenerator<
  TOutput extends z.ZodRawShape,
  TPartialSchema extends z.ZodTypeAny,
>({ input, ...props }: Props) {
  const recipeTokenStream = new RecipeTokenStream();
  const stream = await recipeTokenStream.getStream(input);

  return (
    <Generator
      stream={stream}
      schema={RecipePredictionOutputSchema}
      {...props}
    />
  );
}

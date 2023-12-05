import Generator from "@/components/ai/generator";
import { RemixPredictionOutputSchema } from "@/schema";
import {
  RemixPredictionInput,
  RemixPredictionOutput,
  RemixPredictionPartialOutput,
} from "@/types";
import { z } from "zod";
import { RemixTokenStream } from "./stream";

type Props = {
  input: RemixPredictionInput;
  onStart?: () => void;
  onError?: (error: Error, outputRaw: string) => void;
  onProgress?: (output: RemixPredictionPartialOutput) => void;
  onComplete?: (output: RemixPredictionOutput) => void;
};

export async function RemixGenerator<
  TOutput extends z.ZodRawShape,
  TPartialSchema extends z.ZodTypeAny,
>({ input, ...props }: Props) {
  const tokenStream = new RemixTokenStream();
  const stream = await tokenStream.getStream(input);

  return (
    <Generator
      stream={stream}
      schema={RemixPredictionOutputSchema}
      {...props}
    />
  );
}

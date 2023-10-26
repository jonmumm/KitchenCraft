import { getErrorMessage } from "@/lib/error";
import { sanitizeOutput } from "@/lib/llm";
import { partialUtil } from "@/lib/partial";
import jsYaml from "js-yaml";
import { z } from "zod";

export default async function Generator<
  TOutput extends z.ZodRawShape,
  TPartialOutput extends z.infer<partialUtil.DeepPartial<z.ZodObject<TOutput>>>,
>({
  stream,
  schema,
  onStart,
  onProgress,
  onComplete,
  onError,
}: {
  stream: AsyncIterable<string>;
  schema: z.ZodObject<TOutput>; // the final result zod schema
  onStart?: () => void;
  onProgress?: (output: TPartialOutput) => void;
  onError?: (error: Error, outputRaw: string) => void;
  onComplete?: (output: z.infer<z.ZodObject<TOutput>>) => void;
}) {
  const partialSchema = schema.deepPartial();
  const charArray: string[] = [];
  onStart && onStart();

  for await (const chunk of stream) {
    try {
      for (let char of chunk) {
        charArray.push(char);
      }

      const outputRaw = charArray.join("");
      const outputSanitized = sanitizeOutput(outputRaw);
      const outputYaml = jsYaml.load(outputSanitized);
      const outputParse = partialSchema.safeParse(outputYaml);
      if (outputParse.success) {
        onProgress && onProgress(outputParse.data as TPartialOutput);
        // } else {
        //   console.warn("failed to parse partial schema from outputYaml");
      }
    } catch (ex) {
      // not valid yaml, do nothing
    }
  }

  const outputRaw = charArray.join("");
  const outputYaml = sanitizeOutput(outputRaw);

  let outputJSON;
  try {
    outputJSON = jsYaml.load(outputYaml);
  } catch (error) {
    onError && onError(new Error(getErrorMessage(error)), outputRaw);
    return <></>;
  }

  const outputParse = schema.safeParse(outputJSON);
  if (outputParse.success) {
    onComplete && onComplete(outputParse.data);
  } else {
    onError && onError(outputParse.error, outputRaw);
  }

  return <></>;
}

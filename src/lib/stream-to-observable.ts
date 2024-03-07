import { nanoid } from "ai";
import jsYaml from "js-yaml";
import { Observable, Subject } from "rxjs";
import { z } from "zod";
import { getErrorMessage } from "./error";
import { partialUtil } from "./partial";
import { sanitizeOutput } from "./sanitize";
import { DeepPartial } from "./types";

type WithStart<T extends string> = `${T}_START`;
type WithProgress<T extends string> = `${T}_PROGRESS`;
type WithComplete<T extends string> = `${T}_COMPLETE`;

export type StreamObservableEvent<
  TEventType extends string,
  TOutput extends object,
> =
  | {
      type: WithStart<TEventType>;
      resultId: string;
    }
  | {
      type: WithProgress<TEventType>;
      data: DeepPartial<TOutput>;
    }
  | {
      type: WithComplete<TEventType>;
      data: TOutput;
    };

export function streamToObservable<
  TStreamType extends string,
  TOutput extends z.ZodRawShape,
  TPartialOutput extends z.infer<partialUtil.DeepPartial<z.ZodObject<TOutput>>>,
>(
  tokenStream: AsyncIterable<string>, // Changed from EventSource to AsyncIterable<string>
  streamType: TStreamType,
  schema: z.ZodObject<TOutput>
): Observable<StreamObservableEvent<TStreamType, TOutput>> {
  const subject = new Subject<
    | StreamObservableEvent<TStreamType, TOutput>
    | { type: "$$xstate.error"; error: Error; outputRaw: string }
  >();
  const charArray: string[] = [];
  const partialSchema = schema.partial();

  (async () => {
    try {
      let started = false;

      for await (const chunk of tokenStream) {
        if (!started) {
          subject.next({
            type: `${streamType}_START`,
            resultId: nanoid(),
          });
          started = true;
        }

        for (const char of chunk) {
          charArray.push(char);
        }

        const outputRaw = charArray.join("");
        const outputSanitized = sanitizeOutput(outputRaw);
        let outputYaml;
        try {
          outputYaml = jsYaml.load(outputSanitized);
        } catch (ex) {
          // normal to not always parse
          continue;
        }
        const outputParse = partialSchema.safeParse(outputYaml);
        if (outputParse.success) {
          subject.next({
            type: `${streamType}_PROGRESS`,
            data: outputParse.data as TPartialOutput,
          });
        }
      }

      const outputRaw = charArray.join("");
      const outputYaml = sanitizeOutput(outputRaw);
      const outputJSON = jsYaml.load(outputYaml);
      const outputParse = schema.safeParse(outputJSON);
      if (outputParse.success) {
        subject.next({
          type: `${streamType}_COMPLETE`,
          data: outputParse.data as unknown as TOutput,
        });
      } else {
        throw outputParse.error;
      }
    } catch (error) {
      subject.next({
        type: "$$xstate.error",
        error: new Error(getErrorMessage(error)),
        outputRaw: charArray.join(""),
      });
    } finally {
      subject.complete();
    }
  })();

  return subject as Observable<StreamObservableEvent<TStreamType, TOutput>>;
}

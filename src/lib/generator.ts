import jsYaml from "js-yaml";
import { Observable, Subject } from "rxjs";
import { z } from "zod";
import { getErrorMessage } from "./error";
import { sanitizeOutput } from "./llm";
import { partialUtil } from "./partial";
import { DeepPartial } from "./types";

type WithStart<T extends string> = `${T}_START`;
type WithProgress<T extends string> = `${T}_PROGRESS`;
type WithComplete<T extends string> = `${T}_COMPLETE`;

export type GeneratorObervableEvent<
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

type EventSourceMessage<
  TEventType extends string,
  TOutput extends z.ZodRawShape,
> =
  | { type: "$$xstate.error"; error: Error; outputRaw: string }
  | { type: "$$xstate.complete" }
  | GeneratorObervableEvent<TEventType, TOutput>;

export function eventSourceToGenerator<
  TEventType extends string,
  TOutput extends z.ZodRawShape,
  TPartialOutput extends z.infer<partialUtil.DeepPartial<z.ZodObject<TOutput>>>,
>(
  source: EventSource,
  eventType: TEventType,
  schema: z.ZodObject<TOutput>
): Observable<EventSourceMessage<TEventType, TOutput>> {
  const subject = new Subject<EventSourceMessage<TEventType, TOutput>>();
  const charArray: string[] = [];
  const partialSchema = schema.partial();

  let resultId: string | undefined;

  source.onmessage = (event) => {
    try {
      const data = z.string().parse(JSON.parse(event.data));
      if (!resultId) {
        resultId = data;
        subject.next({
          type: `${eventType}_START`,
          resultId,
        });
        return;
      }

      for (const char of data) {
        charArray.push(char);
      }

      const outputRaw = charArray.join("");
      const outputSanitized = sanitizeOutput(outputRaw);
      const outputYaml = jsYaml.load(outputSanitized);
      const outputParse = partialSchema.safeParse(outputYaml);
      if (outputParse.success) {
        subject.next({
          type: `${eventType}_PROGRESS`,
          data: outputParse.data as TPartialOutput,
        });
      }
    } catch (ex) {
      // console.error(ex);
    }
    // for (chunk of event.)
  };

  source.onerror = (event) => {
    // the server closes it's conneciton when done which
    // results in an error
    // it's not actually en error if we are able to parse the response successfull
    const outputRaw = charArray.join("");
    const outputYaml = sanitizeOutput(outputRaw);

    try {
      const outputJSON = jsYaml.load(outputYaml);
      const outputParse = schema.safeParse(outputJSON);
      if (outputParse.success) {
        subject.next({
          type: `${eventType}_COMPLETE`,
          data: outputParse.data as unknown as TOutput,
        });
      } else {
        subject.next({
          type: "$$xstate.error",
          error: outputParse.error,
          outputRaw,
        });
      }
    } catch (error) {
      subject.next({
        type: "$$xstate.error",
        error: new Error(getErrorMessage(error)),
        outputRaw,
      });
    }

    source.close();
    subject.next({
      type: "$$xstate.complete",
    });
    subject.complete();
  };

  return subject;
}

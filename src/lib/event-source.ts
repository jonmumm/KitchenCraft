import EventSource from "@sanity/eventsource";
import jsYaml from "js-yaml";
import { Observable, Subject } from "rxjs";
import { z } from "zod";
import { getErrorMessage } from "./error";
import { sanitizeOutput } from "./sanitize";
import { partialUtil } from "./partial";

type WithProgress<T extends string> = `${T}_PROGRESS`;
type WithComplete<T extends string> = `${T}_COMPLETE`;

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T[P] extends Function
    ? T[P]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

type GeneratorObervableEvent<
  TEventType extends string,
  TOutput extends object,
> =
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

export function eventSourceToObservable<
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

  source.onmessage = (event) => {
    try {
      for (const char of JSON.parse(event.data)) {
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

      // const outputParse = partialSchema.safeParse(outputYaml);
      // if (outputParse.success) {
      //   subject.next({
      //     type: "SUGGESTION_PREDICTION_PROGRESS",
      //     data: outputParse.data,
      //   });
      // }
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

export function eventSourceToAsyncIterable(
  stream: string
): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<string> {
      let eventQueue: any[] = [];
      let resolve: Function | null = null;
      const source = new EventSource(stream, { withCredentials: true });

      source.addEventListener("output", (e) => {
        // console.log(e.data);
        if (resolve) {
          resolve({ value: e.data, done: false });
          resolve = null;
        } else {
          eventQueue.push(e.data);
        }
      });

      source.addEventListener("error", () => {
        if (resolve) {
          resolve({ value: null, done: true });
          resolve = null;
        }
      });

      source.addEventListener("done", () => {
        if (resolve) {
          resolve({ value: null, done: true });
          resolve = null;
        }
        source.close();
      });

      return {
        async next() {
          if (eventQueue.length > 0) {
            return { value: eventQueue.shift(), done: false };
          }

          return new Promise((res) => {
            resolve = res;
          });
        },
      };
    },
  };
}

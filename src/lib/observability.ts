import { Attributes, Span, SpanKind, context, trace } from "@opentelemetry/api";
import { getErrorMessage } from "./error";

interface SQLResult {
  sql: string;
  params: unknown[];
}

interface Query {
  execute: () => Promise<any>;
  toSQL: () => SQLResult;
}

export function withDatabaseSpan<T extends Query>(
  query: T,
  spanName: string
): T {
  const tracer = trace.getTracer("default");
  const originalExecute = query.execute;

  query.execute = async () => {
    const span: Span = tracer.startSpan(spanName, {
      attributes: {
        "db.system": "postgres",
        "db.statement": query.toSQL().sql,
      },
      kind: SpanKind.CLIENT,
    });
    try {
      const result = await context.with(
        trace.setSpan(context.active(), span),
        () => originalExecute()
      );
      return result;
    } catch (error) {
      span.recordException(getErrorMessage(error));
      throw error;
    } finally {
      // End the span
      span.end();
    }
  };

  return query;
}

export function withStreamSpan<T>(
  stream: AsyncIterable<T>,
  spanName: string,
  attributes?: Attributes
): AsyncIterable<T> {
  const tracer = trace.getTracer("default");
  const span = tracer.startSpan(spanName, {
    attributes: attributes,
  });

  // Initialize an array to accumulate the stream output
  const accumulatedOutput: T[] = [];

  return {
    async *[Symbol.asyncIterator]() {
      try {
        for await (const item of stream) {
          accumulatedOutput.push(item);
          yield item;
        }
      } catch (error) {
        span.recordException(getErrorMessage(error));
        throw error;
      } finally {
        // Report the accumulated output as an attribute before ending the span
        span.setAttribute("kc.result", JSON.stringify(accumulatedOutput));
        span.end();
      }
    },
  };
}

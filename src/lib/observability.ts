import { Span, SpanKind, context, trace } from "@opentelemetry/api";
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

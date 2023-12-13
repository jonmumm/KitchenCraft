import { Span, SpanKind, context, trace } from "@opentelemetry/api";
import { getErrorMessage } from "./error";

// This function wraps a database query function with an OpenTelemetry span
export function withDatabaseSpan<T extends (...args: any[]) => Promise<any>>(
  queryFunction: T, // The database query function to wrap
  spanName: string, // Name of the span
  attributes: Record<string, any> = {} // Additional attributes to set on the span
): (...funcArgs: Parameters<T>) => Promise<ReturnType<T>> {
  const tracer = trace.getTracer("default");

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const span: Span = tracer.startSpan(spanName, {
      attributes: {
        "db.system": "postgres",
        ...attributes,
      },
      kind: SpanKind.CLIENT,
    });

    try {
      // Execute the original database function within the context of the span
      const result = await context.with(
        trace.setSpan(context.active(), span),
        () => queryFunction(...args)
      );
      return result;
    } catch (error) {
      // Record the error in the span if the query fails
      span.recordException(getErrorMessage(error));
      throw error;
    } finally {
      // End the span
      span.end();
    }
  };
}

// Example usage
// const tracer = trace.getTracer('your-service-name');

// const getMembersBySubscriptionIdTraced = withDatabaseSpan(
//   tracer,
//   getMembersBySubscriptionId,
//   'GetMembersBySubscriptionId',
//   { 'db.table': 'SubscriptionMembersTable' }
// );

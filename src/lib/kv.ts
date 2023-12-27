import { trace } from "@opentelemetry/api";
import { kv as vercelKv } from "@vercel/kv";
import { getErrorMessage } from "./error";

function formatRedisCommand(method: string, args: any[]): string {
  // Example formatting, adjust as necessary for your use case
  return `${method.toUpperCase()} ${args.join(' ')}`;
}

function instrumentVercelKVClient(client: typeof vercelKv): typeof vercelKv {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const originalProperty = Reflect.get(target, prop, receiver);

      if (typeof originalProperty === "function") {
        return (...args: any[]) => {
          const span = trace.getTracer("default").startSpan(`Redis: ${String(prop)}`);

          span.setAttribute('db.system', 'redis');
          // If you have a way to determine the database index, set it here
          // span.setAttribute('db.redis.database_index', databaseIndex);
          const statement = formatRedisCommand(String(prop), args);
          span.setAttribute('db.statement', statement);

          let result;
          try {
            result = originalProperty.apply(target, args);

            if (result instanceof Promise) {
              return result.finally(() => span.end());
            }
          } catch (error) {
            span.recordException(getErrorMessage(error));
            throw error;
          } finally {
            if (!(result instanceof Promise)) {
              span.end();
            }
          }

          return result;
        };
      }

      return originalProperty;
    },
  });
}

export const kv = instrumentVercelKVClient(vercelKv);

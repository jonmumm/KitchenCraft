import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { ZodType, ZodTypeAny, z } from "zod";

// Define your cookie keys and corresponding schemas
const PUSH_PERMISSION_STATE_KEY = "permissionState:push";
const APP_SESSION_ID_KEY = "appSessionId";

// Define a map of cookie keys to their Zod schemas
const cookieSchemas = {
  [PUSH_PERMISSION_STATE_KEY]: z
    .enum(["granted", "prompt", "denied"])
    .optional(),
  [APP_SESSION_ID_KEY]: z.string().optional(),
  // Add more cookies and their schemas here
} as const;

type CookieSchemas = typeof cookieSchemas;
type CookieKeys = keyof CookieSchemas;

/**
 * Parses a cookie based on its key and validates it against a predefined schema.
 *
 * @param key - The key of the cookie to parse.
 * @return - The parsed and validated cookie value, or undefined if invalid.
 */
export function parseCookie<K extends CookieKeys>(key: K) {
  const cookieStore = cookies();
  const schema = cookieSchemas[key];

  if (!schema) {
    console.error(`No schema defined for cookie key: ${key}`);
    return undefined;
  }

  const cookieValue = cookieStore.get(key)?.value;
  if (cookieValue === undefined) {
    return undefined;
  }

  try {
    // todo handle non-string types, parse json?
    return schema.parse(cookieValue) as InferSchemaType<CookieSchemas[K]>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Invalid cookie value for ${key}:`, error.issues);
    }
    return undefined;
  }
}

type InferSchemaType<T extends ZodTypeAny> = T extends ZodType<
  infer U,
  any,
  any
>
  ? U
  : never;

export function setCookie<K extends CookieKeys>(
  key: K,
  value: InferSchemaType<CookieSchemas[K]>,
  cookie?: Partial<ResponseCookie> | undefined
): void {
  const cookieStore = cookies();
  const schema = cookieSchemas[key];

  if (!schema) {
    console.error(`No schema defined for cookie key: ${key}`);
    return;
  }

  try {
    const validatedValue = schema.parse(value);
    if (typeof validatedValue === "string") {
      cookieStore.set(key, validatedValue, cookie);
    } else {
      cookieStore.set(key, JSON.stringify(validatedValue), cookie);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Invalid value provided for ${key}:`, error.issues);
    }
  }
}

export const MAX_INT = 2147483647; // year 2038
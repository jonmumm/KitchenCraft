import { cookies } from "next/headers";
import { z, ZodTypeAny } from "zod";

/**
 * Creates a generic cookie handler with Zod schema validation.
 * 
 * @param key - The key of the cookie.
 * @param schema - The Zod schema for validating the cookie value.
 */
function createCookieHandler<T extends ZodTypeAny>(key: string, schema: T) {
  const cookieStore = cookies();

  return {
    /**
     * Gets the value of the cookie, validated against the schema.
     * 
     * @return {ReturnType<T['parse']>} - The validated cookie value or undefined.
     */
    get: (): ReturnType<T['parse']> | undefined => {
      const cookieValue = cookieStore.get(key)?.value;
      try {
        return schema.parse(cookieValue);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Invalid cookie value:", error.issues);
        }
        return undefined;
      }
    },

    /**
     * Sets the value of the cookie after validating it against the schema.
     * 
     * @param {ReturnType<T['parse']>} value - The value to be set in the cookie.
     */
    set: (value: ReturnType<T['parse']>): void => {
      try {
        const validatedValue = schema.parse(value);
        cookieStore.set(key, JSON.stringify(validatedValue));
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Invalid value provided:", error.issues);
        }
      }
    }
  };
}

// Usage example
const PUSH_PERMISSION_STATE_KEY = "permissionState:push";
const permissionStateSchema = z.union([
  z.literal("granted"),
  z.literal("prompt"),
  z.literal("denied"),
  z.undefined(),
]);

export const pushPermissionCookie = createCookieHandler(PUSH_PERMISSION_STATE_KEY, permissionStateSchema);

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function assert<T>(
  expression: T,
  errorMessage: string
): asserts expression {
  if (!expression) {
    throw new Error(errorMessage);
  }
}

export function assertType<
  TE extends { type: string },
  TType extends TE["type"]
>(event: TE, eventType: TType): asserts event is TE & { type: TType } {
  if (event.type !== eventType) {
    throw new Error(
      `Invalid event: expected "${eventType}", got "${event.type}"`
    );
  }
}

// Utility function to convert a sentence into slug format
function sentenceToSlug(sentence: string): string {
  return sentence
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Generate a random ID with a given length
export function generateRandomId(length: number = 6): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export function getChatRecipeSlug(chatId: string, name: string): string {
  const slug = sentenceToSlug(name);
  const chatSlug = chatId.toLowerCase().slice(0, 5);
  return `${chatSlug}-${slug}`;
}

export async function pollWithExponentialBackoff(checkFunction: () => Promise<boolean>, maxWaitTime: number = 60000) {
  let waitTime = 1000;  // starting with 1 second
  const maxRetries = Math.log2(maxWaitTime/waitTime);  // Calculating max retries based on maxWaitTime and initial waitTime

  for (let i = 0; i < maxRetries; i++) {
    const isDone = await checkFunction();
    if (isDone) return true;

    await new Promise(resolve => setTimeout(resolve, waitTime));
    waitTime *= 2; // doubling the wait time for the next iteration
  }

  return false; // return false after max retries are exhausted without success
}

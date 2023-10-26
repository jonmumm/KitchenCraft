import { clsx, type ClassValue } from "clsx";
import { MapStore } from "nanostores";
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
  TType extends TE["type"],
>(event: TE, eventType: TType): asserts event is TE & { type: TType } {
  if (event.type !== eventType) {
    throw new Error(
      `Invalid event: expected "${eventType}", got "${event.type}"`
    );
  }
}

// Utility function to convert a sentence into slug format
export function sentenceToSlug(sentence: string): string {
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

export async function pollWithExponentialBackoff(
  checkFunction: () => Promise<boolean>,
  maxWaitTime: number = 60000
) {
  let waitTime = 1000; // starting with 1 second
  const maxRetries = Math.log2(maxWaitTime / waitTime); // Calculating max retries based on maxWaitTime and initial waitTime

  for (let i = 0; i < maxRetries; i++) {
    const isDone = await checkFunction();
    if (isDone) return true;

    await new Promise((resolve) => setTimeout(resolve, waitTime));
    waitTime *= 2; // doubling the wait time for the next iteration
  }

  return false; // return false after max retries are exhausted without success
}

export function formatDuration(duration: string | undefined) {
  if (!duration) {
    return "";
  }
  const match = duration.match(/^PT(\d+H)?(\d+M)?(\d+S)?$/);
  if (!match) {
    return "";
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  const formattedParts = [];

  if (hours > 0) {
    formattedParts.push(`${hours}h`);
  }

  if (minutes > 0) {
    formattedParts.push(`${minutes}m`);
  }

  if (seconds > 0) {
    formattedParts.push(`${seconds}s`);
  }

  return formattedParts.join(" ");
}

export function debounce(
  func: (...args: any[]) => void,
  wait: number
): (...args: any[]) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: any[]): void => {
    const later = () => {
      timeoutId = null;
      func(...args);
    };

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(later, wait);
  };
}

export function throttle(
  func: (...args: any[]) => void,
  limit: number
): (...args: any[]) => void {
  let inThrottle: boolean = false;

  return (...args: any[]): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function simpleHash(str: string): string {
  let hash = 0,
    i,
    chr;
  if (str.length === 0) return hash.toString();
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

export function getObjectHash(obj: any): string {
  const str = JSON.stringify(obj);
  return simpleHash(str);
}

export const noop = () => {};

export const waitForStoreValue = async <TSelect, TStoreProps extends object>(
  store: MapStore<TStoreProps>,
  selector: (state: ReturnType<MapStore<TStoreProps>["get"]>) => TSelect
): Promise<TSelect> => {
  const value = selector(store.get());
  if (typeof value !== "undefined") {
    return value;
  }

  return new Promise((resolve) => {
    const unsub = store.listen((state) => {
      const value = selector(state);
      if (typeof value !== "undefined") {
        unsub();
        resolve(value);
      }
    });
  });
};

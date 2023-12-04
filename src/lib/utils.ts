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

export function slugToSentence(slug: string): string {
  // Replace dashes with spaces
  let sentence = slug.replace(/-/g, " ");

  // Capitalize the first letter of each word
  sentence = sentence
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return sentence;
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

export function getObjectHash(obj: any): string {
  // Serialize the object with sorted keys
  const sortedObjString = JSON.stringify(obj, Object.keys(obj).sort());

  // Simple hash function (for demonstration purposes)
  let hash = 0,
    i,
    chr;
  for (i = 0; i < sortedObjString.length; i++) {
    chr = sortedObjString.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  // Convert hash to a string and return the first 8 characters
  return ("00000000" + hash.toString(16)).substr(-8);
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

export const isMobile = () => {
  // Return false if the `navigator` object is not present
  if (typeof navigator === "undefined") return false;

  // Check the user agent string against mobile patterns
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export function timeAgo(isoString: string): string {
  const past = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - past.getTime(); // difference in milliseconds

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} days ago`;
  } else if (hours > 0) {
    return `${hours} hours ago`;
  } else if (minutes > 0) {
    return `${minutes} minutes ago`;
  } else {
    return `${seconds} seconds ago`;
  }
}

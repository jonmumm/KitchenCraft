import { createHash } from "crypto";

export const buildInput = ({
  prompt,
  tokens,
}: {
  prompt: string;
  tokens: string[];
}) => {
  return prompt.length ? prompt + ", " + tokens.join(", ") : tokens.join(", ");
};

export function generateUrlSafeHash(input: string): string {
  // Generate a hash using SHA-256
  const hash = createHash("sha256").update(input).digest("base64");
  // Convert to URL-safe format and trim to 8 characters
  let urlSafeHash = hash
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  urlSafeHash = urlSafeHash.substring(0, 8);

  return urlSafeHash;
}

export function isEqual<T>(arr1: T[], arr2: T[]): boolean {
  console.log(arr1, arr2);
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

export const notificationType = [
  "trends",
  "products",
  "top_recipes",
  "tips_and_tricks",
  "awards",
] as const; // todo figure out how to get type from pgEnum

export type NotificationType = (typeof notificationType)[number];

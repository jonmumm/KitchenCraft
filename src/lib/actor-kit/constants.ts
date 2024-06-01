import { env } from "@/env.public";

// todo make this configurable at the sdk level
export const API_SERVER_PROTOCOL =
  env.KITCHENCRAFT_API_HOST.startsWith("localhost") ||
  env.KITCHENCRAFT_API_HOST.startsWith("0.0.0.0") ||
  env.KITCHENCRAFT_API_HOST.startsWith("127.0.0.1")
    ? "http"
    : "https";

export const API_SERVER_URL = `${API_SERVER_PROTOCOL}://${env.KITCHENCRAFT_API_HOST}`;

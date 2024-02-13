// import { env } from "@/env";

import { env } from "@/env.public";

export const API_SERVER_PROTOCOL =
  env.KITCHENCRAFT_API_HOST.startsWith("localhost") ||
  env.KITCHENCRAFT_API_HOST.startsWith("127.0.0.1")
    ? "http"
    : "https";

export const API_SERVER_URL = `${API_SERVER_PROTOCOL}://${env.KITCHENCRAFT_API_HOST}`;

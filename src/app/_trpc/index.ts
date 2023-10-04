export const trpcUrl =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/trpc`
    : "http://localhost:3000/api/trpc";

console.log({ trpcUrl, ENV_VL: process.env.NEXT_PUBLIC_VERCEL_URL });

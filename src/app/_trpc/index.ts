export const trpcUrl =
  process.env.NODE_ENV === "production"
    ? `${process.env.NEXT_PUBLIC_VERCEL_URL}/api/trpc`
    : "http://localhost:3000/api/trpc";

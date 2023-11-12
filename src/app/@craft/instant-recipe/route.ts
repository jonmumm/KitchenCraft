import { NextRequest } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const prompt = z
    .string()
    .min(1)
    .parse(req.nextUrl.searchParams.get("prompt"));
  return Response.json({ foo: prompt });
}

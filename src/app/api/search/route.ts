import { LLMMessageSet } from "@/types";
import { NextApiRequest } from "next";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const SearchParamsSchema = z.object({
  prompt: z.string(),
});

const getSearchParams = (url: string) => {
  // const params = new URLSearchParams(new URL(url!).search);
};

export async function GET(req: NextApiRequest) {
  const { searchParams } = new URL(req.url!);

  const data = SearchParamsSchema.partial().parse(
    Object.fromEntries(searchParams)
  );

  console.log(searchParams, searchParams.toString());
  console.log({ data });
  // new URL(req.url)
  // const params = new URLSearchParams(new URL(req.url!).search);

  // console.log(params);
  // console.log(req.query);
  return NextResponse.json(data);
}

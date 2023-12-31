import { NextResponse } from "next/server";
import { z } from "zod";
import ingredlientList from "../../../data/ingredient-list.json";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function GET(req: Request) {
  const params = new URLSearchParams(req.url.split("?")[1]);

  const prompt = z.string().min(1).parse(params.get("prompt"));

  const matches = ingredlientList
    .filter((ingredient) => {
      return ingredient.toLowerCase().indexOf(prompt.toLowerCase()) >= 0;
    })
    .slice(0, 10);

  return NextResponse.json(matches);
}

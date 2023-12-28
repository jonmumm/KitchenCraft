import { kv } from "@/lib/kv";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _: NextRequest,
  { params }: { params: { slug: string } }
) {
  const multi = kv.multi();
  multi.hincrby(`recipe:${params.slug}`, "upvotes", 1);
  multi.zincrby("leaderboard", 1, params.slug);

  await multi.exec();

  return NextResponse.json(
    JSON.stringify({
      status: "ok",
    })
  );
}

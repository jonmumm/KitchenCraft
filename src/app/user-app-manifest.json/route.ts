import { assert } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const appInstallToken = searchParams.get("token");
  assert(appInstallToken, "expected `token` in user-app-manifest.json request");
  const start_url = `/startup?token=${appInstallToken}`;

  return NextResponse.json({
    name: "KitchenCraft",
    short_name: "KitchenCraft",
    description: "Create unique recipes, instantly.",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    background_color: "#000000",
    theme_color: "#000000",
    start_url,
    display: "standalone",
    orientation: "portrait",
  });
}

import { Badge } from "@/components/display/badge";
import Image from "next/image";
import Link from "next/link";
import { BadgeText } from "./badge-text";
import { IsOnboaridngInComplete } from "./components.client";

export function QuizBanner() {
  return (
    <IsOnboaridngInComplete>
      <div className="crafting:hidden">
        <Link
          className="absolute top-0 left-0 -rotate-45 bg-green px-40 py-2 translate-y-16 -translate-x-40 hidden lg:flex flex-row gap-1 bg-green-500 shadow-xl z-20"
          href="/quiz"
        >
          <div className="flex flex-row justify-between w-full items-center">
            <div className="flex flex-col items-center justify-center h-100">
              <h1 className="font-semibold text-sm text-white leading-5">
                Take The Quiz
              </h1>
              <p className="text-xs text-slate-50">
                For personalized recipe results
              </p>
            </div>
          </div>
        </Link>
        <div className="bg-black flex flex-row gap-2 px-4 py-2 items-center justify-center lg:hidden">
          <div className="w-8 bg-black">
            <Image
              alt="KitchenCraft App Icon"
              width={512}
              height={512}
              className="rounded-sm"
              style={{
                border: "1px solid #640F89",
                // boxShadow: "0px 1px 2px #9415CA",
              }}
              src="/apple-touch-icon.png"
            />
          </div>
          <div className="flex flex-row justify-between w-full items-center">
            <div className="flex flex-col items-start justify-center h-100">
              <h1 className="font-semibold text-sm text-slate-50 leading-5">
                Take The Quiz
              </h1>
              <p className="text-xs text-center text-slate-400">
                For personalized recipe results
              </p>
            </div>
            <div>
              <Link href="/quiz">
                <Badge className="text-white dark:text-white" variant="success">
                  <BadgeText />
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </IsOnboaridngInComplete>
  );
}

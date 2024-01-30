import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { ChevronsRightIcon, XIcon } from "lucide-react";
import Link from "next/link";

export async function OnboardingStartCard() {
  return (
    <Card className="border-solid border-2 border-t-4 border-t-green-400 dark:border-t-green-600 p-4 flex flex-col gap-3 rounded-2xl">
      <div className="flex flex-row justify-between w-full items-center">
        <h3 className="text-xl font-semibold">🙋First Timer?</h3>
        <Button variant="outline" size="icon">
          <XIcon />
        </Button>
      </div>
      <p className="opacity-70 text-med">
        Get started with KitchenCraft to instantly create personalized recipes.
      </p>
      <Link className="flex flex-row justify-end" href="/quick-start">
        <Button>
          Quick Start <ChevronsRightIcon className="ml-1" size={16} />
        </Button>
      </Link>
    </Card>
  );
}

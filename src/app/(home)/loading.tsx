import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { SkeletonSentence } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { getTimezone } from "@/lib/headers";
import { CheckIcon } from "lucide-react";

export default function Loading() {
  const timezone = getTimezone();
  const date = new Date();
  const today = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

  return (
    <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
      <div className="px-4 mt-8 max-w-3xl w-full mx-auto">
        <h3 className="text-lg font-medium">
          Today&apos;s Cookbook
          <span className="text-muted-foreground text-sm ml-2">{today}</span>
        </h3>
      </div>
      <div className="m-4 flex flex-col gap-8">
        {new Array(3).fill(0).map((_, index) => (
          <Card
            key={index}
            className="max-w-3xl w-full mx-auto border-solid border-t-4"
            style={{ borderTopColor: "#ccc" }}
          >
            <CardHeader>
              <CardTitle className="text-lg">
                <SkeletonSentence className="h-7" numWords={3} />
              </CardTitle>
              <CardDescription>
                <SkeletonSentence className="h-5" numWords={7} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-24 ">
                <div className="absolute top-0 w-screen left-1/2 transform -translate-x-1/2 z-10 flex flex-row justify-center">
                  <div className="carousel carousel-center pl-2 pr-8 space-x-2">
                    {new Array(3).fill(0).map((_, recipeIndex) => (
                      <Card
                        key={recipeIndex}
                        className="carousel-item w-72 h-24 flex flex-row gap-2 justify-center items-center px-4"
                      >
                        <div className="flex flex-col gap-2 flex-1">
                          <CardTitle className="text-md">
                            <SkeletonSentence numWords={3} className="h-5" />
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            <SkeletonSentence numWords={5} className="h-4" />
                          </CardDescription>
                        </div>
                        <Button
                          className={"rounded-full"}
                          variant="outline"
                          size="icon"
                        >
                          <CheckIcon className={"hidden"} />
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

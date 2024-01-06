import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { db } from "@/db";
import { getRecipe } from "@/db/queries";
import { assert } from "@/lib/utils";
import { ShuffleIcon } from "lucide-react";
import { getAllVersionsOfRecipeBySlug } from "./queries";

type Props = {
  params: { slug: string };
};

export default async function Page(props: Props) {
  const { slug } = props.params;
  const [recipe, versions] = await Promise.all([
    getRecipe(slug),
    getAllVersionsOfRecipeBySlug(db, slug),
  ]);
  assert(recipe, "expected recipe");

  return (
    <div className="flex flex-col gap-2 max-w-xl mx-auto">
      <Card className="flex flex-col gap-2 pb-5 mx-3">
        <div className="flex flex-row gap-3 p-5 justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{recipe.name}</h1>
            <p className="text-lg text-muted-foreground">
              {recipe.description}
            </p>
          </div>
        </div>

        <div className="p-4">
          <ul className="timeline max-sm:timeline-compact timeline-vertical">
            {versions.map((version, index) => {
              return (
                <li key={index}>
                  {index !== 0 && <hr />}
                  <div className="timeline-start flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">
                      Fri Dec 29 @ 10:32am
                    </span>
                    <div className="flex flex-row max-sm:justify-start justify-end">
                      <Badge variant="secondary">Version {index}</Badge>
                    </div>
                  </div>
                  <div className="timeline-middle">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="timeline-end pb-16">
                    <div>
                      <h3 className="text-sm font-medium inline-block">
                        {recipe.name}
                      </h3>
                    </div>
                    <span className="text-muted-foreground text-sm italic">
                      &quot;{version.prompt}.&quot;
                    </span>
                  </div>
                  <hr />
                </li>
              );
            })}
            <li>
              <hr />
              <div className="timeline-middle">
                <Button variant="outline" className="flex flex-row gap-1">
                  <span>Create Remix</span>
                  <ShuffleIcon size={16} />
                </Button>
              </div>
              <div className="timeline-end"></div>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

import { Card } from "@/components/display/card";
import { getRecipe } from "@/db/queries";
import { assert } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Props = {
  params: { slug: string };
};

export default async function Page(props: Props) {
  const { slug } = props.params;
  const [recipe] = await Promise.all([getRecipe(slug)]);
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
          <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
            <li>
              <div className="timeline-middle">
                <CheckCircle2 />
              </div>
              <div className="timeline-start md:text-end mb-10">
                <time className="font-mono italic">
                  {new Date().toDateString()}
                </time>
                <Link href="/" className="block underline">
                  <div className="text-md font-semibold">Verion 1</div>
                </Link>
                <span className="text-muted-foreground text-sm italic">
                  &quot;Give me a Shepherd&apos;s Pie recipe.&quot;
                </span>
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-middle">
                <CheckCircle2 />
              </div>
              <div className="timeline-end mb-10">
                <time className="font-mono italic">
                  {new Date().toDateString()}
                </time>
                <div className="text-md font-semibold">
                  Remixed by jonathanrmumm-1
                </div>
                <span className="text-muted-foreground text-sm italic">
                  &quot;Use leftover prime rib instead of group beef.&quot;
                </span>
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-middle">
                <CheckCircle2 />
              </div>
              <div className="timeline-start md:text-end mb-10">
                <time className="font-mono italic">
                  {new Date().toDateString()}
                </time>
                <div className="text-md font-semibold">
                  Remixed by jonathanrmumm-1
                </div>
                <span className="text-muted-foreground text-sm italic">
                  &quot;Use a 12&quot; cast iron instead of a pie pan. Adapt the
                  size to the pan.&quot;
                </span>
              </div>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

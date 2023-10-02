"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { PromptContext } from "@/context/prompt";
import { useStore } from "@nanostores/react";
import { useContext } from "react";

export default function EmptyState() {
  const prompt$ = useContext(PromptContext);

  const { focused } = useStore(prompt$, { keys: ["focused"] });

  return (
    <Collapsible open={!focused}>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 text-center">
          <h3 className="text-xl font-semibold text-slate-950">
            Mise en Place
          </h3>
          <ul className="text-lg text-slate-500 flex flex-col gap-3">
            <section>
              <li>Dream up a recipe,</li>
              <li>always have a plan,</li>
              <li>select your ingredients,</li>
              <li>skillets, pots or pans.</li>
            </section>
            <section>
              <li>Adjust as you go,</li>
              <li>ask if you get stuck,</li>
              <li>it will be delicious,</li>
              <li>with a bit of luck.</li>
            </section>
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

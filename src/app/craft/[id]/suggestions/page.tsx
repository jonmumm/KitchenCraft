import { YamlStructuredOutputParser } from "@/app/api/chat/[id]/suggestions/parser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Command, CommandGroup, CommandList } from "@/components/ui/command";
import { getObjectHash } from "@/lib/utils";
import EventSource from "@sanity/eventsource";
import { PromptTemplate } from "langchain/prompts";
import { redirect } from "next/navigation";
import Replicate from "replicate";
import { z } from "zod";

const replicate = new Replicate();

const SuggestionsParamsSchema = z.object({
  prompt: z.string().min(1).max(100),
});

export default async function Page({
  params: { id },
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string>;
}) {
  const queryParse = SuggestionsParamsSchema.safeParse(searchParams);
  if (!queryParse.success) {
    redirect("/craft");
  }
  const hash = getObjectHash(queryParse.data);
  console.log({ hash });

  // getSimpleHash(searchParams)

  // call the API to run the suggestions...
  // const id =
  console.log({ id, searchParams });
  // Kick off the preduction assuming valid params and rate limiting enforced...

  const chatPrompt = PromptTemplate.fromTemplate(`
You will be provided with a prompt that may include ingredients, dish names, cooking techniques, or other things related to a recipe
for Your task is to return a list of up to 6 recipe names that are related to the prompt.
Come up with six recipes that are sufficiently different from one another in technique or ingredients but within the constraints of the input.

Format: {format_instructions}

Input: {prompt}`);

  const prediction = await replicate.predictions.create({
    stream: true,
    version: "6527b83e01e41412db37de5110a8670e3701ee95872697481a355e05ce12af0e",
    input: {
      prompt: await chatPrompt.format({
        prompt: "feta, eggs, cheese",
        format_instructions: parser.getFormatInstructions(),
      }),
    },
  });

  if (prediction && prediction.urls && prediction.urls.stream) {
    const Authorization = `Bearer ${process.env.REPLICATE_API_TOKEN}`;
    const source = new EventSource(prediction.urls.stream, {
      headers: {
        Authorization,
      },
    });

    source.addEventListener("open", (e) => {
      console.log("open");
    });
    source.addEventListener("output", (e) => {
      console.log("output", e.data);
    });

    source.addEventListener("error", (e) => {
      console.error("error", e);
    });

    source.addEventListener("done", (e) => {
      console.log("DONE!");
      source.close();
      console.log("done", JSON.parse(e.data));
    });
  }

  async function refreshAction() {
    "use server";
    console.log("hi");
  }

  return (
    <Card>
      <Command shouldFilter={false}>
        <CardHeader className="items-start">
          <div className="flex flex-row gap-3 items-center">
            <span className="w-12 aspect-square inline-flex items-center justify-center text-3xl">
              🧪
            </span>
            <div className="flex flex-col gap-1">
              <CardTitle>Conjuring...</CardTitle>
              <CardDescription>Bringing together 6 new ideas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="round-md p-0">
          <CommandList className="p-3 max-h-100">
            <CommandGroup heading="Results">
              <Suggestions />
              {/* <ConjureResultsChat chainId={id} /> */}
            </CommandGroup>
          </CommandList>
        </CardContent>
        {/* <CardFooter className="flex justify-center mt-4">
          <Button className="flex flex-row items-center gap-1">
            <Redo2Icon />
            <span className="font-medium">Start Over</span>
          </Button>
        </CardFooter> */}
      </Command>
    </Card>
  );
}

// const getSuggestions

const Suggestions = async () => {
  return null;
};

const ResultSchema = z.array(
  z.object({
    name: z.string().describe("name of the recipe"),
    description: z
      .string()
      .describe("a 12 word or less blurb describing the recipe"),
  })
);

const parser = new YamlStructuredOutputParser(ResultSchema, [
  {
    name: "Zesty Lemon Herb Chicken",
    description:
      "Juicy chicken marinated in lemon, garlic, and fresh herbs. Perfect grilled.",
  },
  {
    name: "Sweet Potato Coconut Curry",
    description:
      "Creamy coconut milk, aromatic spices, and roasted sweet potatoes. Vegan delight.",
  },
  {
    name: "Chia Berry Parfaif",
    description:
      "Layered fresh berries, yogurt, and chia seed pudding. Healthy breakfast treat.",
  },
]);

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Command, CommandGroup, CommandList } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { getSuggestions } from "@/lib/db";
import {
  getObjectHash,
  noop,
  sentenceToSlug,
  waitForStoreValue,
} from "@/lib/utils";
import {
  RunStatusSchema,
  SuggestionPredictionInputSchema,
  SuggestionSchema,
} from "@/schema";
import { kv } from "@vercel/kv";
import { nanoid } from "ai";
import { ChevronRightIcon, LoaderIcon } from "lucide-react";
import { MapStore, map } from "nanostores";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { z } from "zod";
import SuggestionsGenerator from "./suggestions-generator";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

const PartialSuggestionSchema = SuggestionSchema.partial();

type StoreProps = {
  loading: boolean;
  error: undefined | Error;
  suggestions: z.infer<typeof PartialSuggestionSchema>[];
  savedIds: Record<string, boolean>;
  completeIds: Record<string, boolean>;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const queryParse = SuggestionPredictionInputSchema.safeParse(searchParams);
  if (!queryParse.success) {
    redirect("/craft");
  }

  const input = queryParse.data;
  const inputHash = getObjectHash(input);

  await kv.hsetnx(`suggestions:${inputHash}`, "runStatus", "initializing");

  const runStatus = RunStatusSchema.parse(
    await kv.hget(`suggestions:${inputHash}`, "runStatus")
  );

  const isDone = runStatus === "done";
  const isError = runStatus === "error";
  const isInitializing = runStatus === "initializing";
  const loading = !isDone && !isError;

  if (isError) {
    const outputRaw = (await kv.hget(
      `suggestions:${inputHash}`,
      "outputRaw"
    )) as string;
    return (
      <Card className="p-3 m-4">
        <h3>Error with recipe</h3>
        {/* <p>{error}</p> */}

        <h4>Sanitized Output</h4>
        <h4>Raw Output</h4>
        <Card className="p-5">
          <pre dangerouslySetInnerHTML={{ __html: outputRaw }} />
        </Card>
      </Card>
    );
  }

  const store = map<StoreProps>({
    loading,
    error: undefined,
    savedIds: {} as Record<string, boolean>,
    completeIds: {} as Record<string, boolean>,
    suggestions: isDone
      ? (await getSuggestions(kv, inputHash)).suggestions
      : // Create 6 new ids for each suggestion
        // use to create slugs for each
        new Array(6).fill(0).map(() => ({
          id: nanoid(),
        })),
  });

  const createRecipesThatDontExist = async ({
    suggestions,
    loading,
    completeIds,
    savedIds,
  }: StoreProps) => {
    const isComplete = (suggestionIndex: number) => {
      const nextSuggestionExists = !!suggestions[suggestionIndex + 1]?.name;
      const predictionStillRunning = loading;

      // We know this token is done loading if the suggestion exists
      // or if the whole thing is done loading (in case of the last one)
      return nextSuggestionExists || !predictionStillRunning;
    };

    await Promise.all(
      suggestions.map(async (suggestion, index) => {
        const id = suggestion.id!;
        if (isComplete(index) && id && !completeIds[id]) {
          store.setKey("completeIds", {
            ...completeIds,
            [id]: true,
          });

          const slug = getSlugFromSuggestion(
            SuggestionSchema.parse(suggestion)
          );

          await kv.hset(`recipe:${slug}`, {
            id,
            slug,
            name: suggestion.name,
            description: suggestion.description,
            fromSuggestionsKey: `suggestions:${inputHash}`,
          });

          store.setKey("savedIds", {
            ...savedIds,
            [id]: true,
          });
        }
        return Promise.resolve();
      })
    );
  };

  store.listen((state) => {
    createRecipesThatDontExist(state).then(noop);
  });

  // Cleanup all listeners after state is done loading
  store.listen((state) => {
    if (!state.loading || state.error) {
      setTimeout(() => {
        if (store.lc) {
          store.off();
        }
      }, 1);
    }
  });

  return (
    <>
      <Card className="m-4">
        {isInitializing && (
          <Suspense fallback={null}>
            <SuggestionsGenerator
              input={input}
              onStart={() => {
                kv.hset(`suggestions:${inputHash}`, {
                  runStatus: "started",
                  input,
                }).then(noop);
              }}
              onError={(error, outputRaw) => {
                // console.error(error, outputRaw);
                store.setKey("error", error);
                store.setKey("loading", false);
                kv.hset(`suggestions:${inputHash}`, {
                  runStatus: "error",
                  error,
                  outputRaw,
                }).then(noop);
              }}
              onProgress={(output) => {
                const suggestions = output.suggestions;
                // console.log({ output });
                if (suggestions) {
                  const nextSuggestions = store
                    .get()
                    .suggestions.map((suggestion, index) => {
                      return {
                        ...suggestion,
                        ...suggestions[index],
                      };
                    });

                  store.setKey("suggestions", nextSuggestions);
                }
              }}
              onComplete={(output) => {
                const suggestions = store
                  .get()
                  .suggestions.map((suggestion, index) => {
                    return {
                      ...suggestion,
                      ...output.suggestions[index],
                    };
                  });
                store.setKey("suggestions", suggestions);
                store.setKey("loading", false);

                kv.hset(`suggestions:${inputHash}`, {
                  runStatus: "done",
                  output: { suggestions },
                }).then(noop);
              }}
            />
          </Suspense>
        )}
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
                <Suggestions id={inputHash} store={store} />
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
    </>
  );
}

const Suggestions = async ({
  store,
}: {
  id: string;
  store: MapStore<StoreProps>;
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {store.get().suggestions.map((_, index) => {
        return (
          <SuggestionResult key={index} store={store} index={index}>
            <Card key={index} className="flex flex-row gap-2 p-2 items-center">
              <div className="flex flex-col flex-1 gap-2 items-center">
                <h3 className="w-full flex flex-row font-medium text-lg flex-wrap gap-2">
                  <SuggestionsName store={store} index={index} />
                </h3>
                <div className="w-full flex flex-row flex-wrap gap-1">
                  <SuggestionsDescription store={store} index={index} />
                </div>
              </div>
              <div>
                <Suspense fallback={<LoaderIcon className="animate-spin" />}>
                  <ActionIcon store={store} index={index} />
                </Suspense>
              </div>
            </Card>
          </SuggestionResult>
        );
      })}
    </div>
  );
};

const waitForSuggestionReady = async (
  store: MapStore<StoreProps>,
  index: number
) =>
  await waitForStoreValue(store, (state) => {
    const { id } = state.suggestions[index];
    if ((id && state.savedIds[id]) || !state.loading) {
      return true;
    }
  });

const ActionIcon = async ({
  store,
  index,
}: {
  store: MapStore<StoreProps>;
  index: number;
}) => {
  await waitForSuggestionReady(store, index);

  return <ChevronRightIcon />;
};

const SuggestionResult = ({
  children,
  store,
  index,
}: {
  children: ReactNode;
  store: MapStore<StoreProps>;
  index: number;
}) => {
  return (
    <Suspense fallback={<>{children}</>}>
      <SuggestionLink store={store} index={index}>
        {children}
      </SuggestionLink>
    </Suspense>
  );
};

const SuggestionLink = async ({
  children,
  store,
  index,
}: {
  children: ReactNode;
  store: MapStore<StoreProps>;
  index: number;
}) => {
  await waitForSuggestionReady(store, index);
  const slug = await waitForStoreValue(store, (state) => {
    const suggestionParse = SuggestionSchema.safeParse(
      state.suggestions[index]
    );
    if (suggestionParse.success) {
      return getSlugFromSuggestion(suggestionParse.data);
    }
  });

  return <Link href={`/recipe/${slug}`}>{children}</Link>;
};

const getSlugFromSuggestion = ({ id, name }: { id: string; name: string }) => {
  const str = sentenceToSlug(name);
  const idSlug = id.toLowerCase().slice(0, 5);
  const slug = `${idSlug}-${str}`;

  return slug;
};

const SuggestionsName = async ({
  store,
  index,
}: {
  index: number;
  store: MapStore<StoreProps>;
}) => {
  const tokens = Array.from({ length: MAX_NUM_NAME_TOKENS }).map(
    () => [12, 16, 20][Math.floor(Math.random() * 3)]
  ); // Generate a random width for the token skeleton

  return tokens.map((width, tokenIndex) => {
    return (
      <Suspense
        key={`suggestion-name-${tokenIndex}`}
        fallback={
          tokenIndex < NUM_NAME_PLACHOLDERS ? (
            <Skeleton className={`w-${width} h-7`} />
          ) : null
        }
      >
        <SuggestionNameToken
          tokenIndex={tokenIndex}
          suggestionIndex={index}
          store={store}
        />{" "}
      </Suspense>
    );
  });
};

const MAX_NUM_NAME_TOKENS = 20;
const NUM_NAME_PLACHOLDERS = 4;

const SuggestionNameToken = async ({
  store,
  tokenIndex,
  suggestionIndex,
}: {
  suggestionIndex: number;
  tokenIndex: number;
  store: MapStore<StoreProps>;
}) => {
  const token = await waitForStoreValue(store, (state) => {
    const name = state.suggestions[suggestionIndex]?.name;
    const tokens = name?.split(" ") || [];
    const descriptionExists = !!state.suggestions[suggestionIndex]?.description;
    const nextTokenExists = tokens[tokenIndex + 1];
    const predictionStillRunning = state.loading;

    // We know this token is done loading if the next token exists or if there is a description
    // or if the whole thin gis done loading
    const isLoaded =
      nextTokenExists || descriptionExists || !predictionStillRunning;

    // console.log({ name, tokenIndex, isLoaded, predictionStillRunning });

    if (name && isLoaded) {
      const token = name.split(" ")[tokenIndex];
      if (token) {
        return token;
      } else if (isLoaded) {
        return null;
      }
    }
    return undefined;
  });
  return token ? <>{token}</> : <></>;
};

const MAX_NUM_DESCRIPTION_TOKENS = 40;
const NUM_DESCRIPTION_PLACHOLDERS = 12;

const SuggestionsDescription = async ({
  store,
  index,
}: {
  index: number;
  store: MapStore<StoreProps>;
}) => {
  const tokens = Array.from({ length: MAX_NUM_DESCRIPTION_TOKENS }).map(
    () => [12, 16, 20][Math.floor(Math.random() * 3)]
  );

  return tokens.map((width, tokenIndex) => {
    return (
      <Suspense
        key={`suggestion-description-${tokenIndex}`}
        fallback={
          tokenIndex < NUM_DESCRIPTION_PLACHOLDERS ? (
            <Skeleton className={`w-${width} h-4`} />
          ) : null
        }
      >
        <SuggestionDescriptionToken
          key={tokenIndex}
          tokenIndex={tokenIndex}
          suggestionIndex={index}
          store={store}
        />{" "}
      </Suspense>
    );
  });
};

const SuggestionDescriptionToken = async ({
  store,
  tokenIndex,
  suggestionIndex,
}: {
  suggestionIndex: number;
  tokenIndex: number;
  store: MapStore<StoreProps>;
}) => {
  const token = await waitForStoreValue(store, (state) => {
    const description = state.suggestions[suggestionIndex]?.description;
    const tokens = description?.split(" ") || [];
    const nextSuggestionExists = !!state.suggestions[suggestionIndex + 1]?.name;
    const nextTokenExists = tokens[tokenIndex + 1];
    const predictionStillRunning = state.loading;

    // We know this token is done loading if the next token exists or if there is a description
    // or if the whole thin gis done loading
    const isLoaded =
      nextTokenExists || nextSuggestionExists || !predictionStillRunning;

    if (description && isLoaded) {
      const token = description.split(" ")[tokenIndex];
      if (token) {
        return token;
      } else if (isLoaded) {
        return null;
      }
    }
  });

  return { token } ? <>{token}</> : <></>;
};

// const ResultSchema = z.array(
//   z.object({
//     name: z.string().describe("name of the recipe"),
//     description: z
//       .string()
//       .describe("a 12 word or less blurb describing the recipe"),
//   })
// );

// const parser = new YamlStructuredOutputParser(ResultSchema, [
//   {
//     name: "Zesty Lemon Herb Chicken",
//     description:
//       "Juicy chicken marinated in lemon, garlic, and fresh herbs. Perfect grilled.",
//   },
//   {
//     name: "Sweet Potato Coconut Curry",
//     description:
//       "Creamy coconut milk, aromatic spices, and roasted sweet potatoes. Vegan delight.",
//   },
//   {
//     name: "Chia Berry Parfaif",
//     description:
//       "Layered fresh berries, yogurt, and chia seed pudding. Healthy breakfast treat.",
//   },
// ]);

// const createSuggestionsPrediction = async (prompt: string) => {
//   const systemPromptTemplate = PromptTemplate.fromTemplate(`
// You will be provided with an input prompt that may include ingredients, dish names, cooking techniques, or other things related to a recipe
// Come up with six recipes that are sufficiently different from one another in technique or ingredients but related to the input.

// Format: {format_instructions}`);

//   const prediction = await replicate.predictions.create({
//     stream: true,
//     version: "6527b83e01e41412db37de5110a8670e3701ee95872697481a355e05ce12af0e",
//     input: {
//       temperature: 0.2,
//       system_prompt: await systemPromptTemplate.format({
//         format_instructions: parser.getFormatInstructions(),
//       }),
//       prompt: prompt,
//     },
//   });
//   return prediction;
// };

// const connectStoreToStream = (
//   store: MapStore<StoreProps>,
//   streamUrl: string,
//   inputHash: string
// ) => {
//   const Authorization = `Bearer ${process.env.REPLICATE_API_TOKEN}`;
//   const charArr: string[] = [];

//   const source = new EventSource(streamUrl, {
//     headers: {
//       Authorization,
//     },
//   });

//   source.addEventListener("open", async (e) => {
//     await kv.hset(`suggestions:${inputHash}`, {
//       runStatus: "receiving",
//     });
//     console.log("receiving");
//   });

//   source.addEventListener("output", (e) => {
//     charArr.push.apply(charArr, e.data.split(""));

//     try {
//       const partialResult = charArr.join("");
//       const partialYaml = jsYaml.load(sanitizeOutput(partialResult));

//       try {
//         const partialSuggestions = z
//           .array(PartialSuggestionSchema)
//           .parse(partialYaml);

//         const nextSuggestions = store
//           .get()
//           .suggestions.map((suggestion, index) => {
//             return {
//               ...suggestion,
//               ...partialSuggestions[index],
//             };
//           });

//         store.setKey("suggestions", nextSuggestions);
//       } catch (ex) {
//         // will occasionally fail if there is a null item or 'name' instead of 'name:'
//       }
//     } catch (ex) {
//       // no-op, expected that some will fail
//     }
//   });

//   source.addEventListener("error", async (error) => {
//     console.log("error");
//     await kv.hset(`suggestions:${inputHash}`, {
//       runStatus: "error",
//       error,
//     });
//   });

//   source.addEventListener("done", async (e) => {
//     let yamlOutput: unknown;
//     const outputRaw = charArr.join("").trim();
//     const outputSanitized = sanitizeOutput(outputRaw);
//     try {
//       console.log("loading yaml", outputRaw);
//       yamlOutput = jsYaml.load(outputSanitized);
//     } catch (ex) {
//       await kv.hset(`suggestions:${inputHash}`, {
//         runStatus: "error",
//         error: "unable to parse yaml of final result",
//         outputRaw,
//         outputSanitized,
//       });
//       return;
//     }

//     try {
//       const partialSuggestions = z
//         .array(PartialSuggestionSchema)
//         .parse(yamlOutput);
//       const suggestions = store.get().suggestions.map((suggestion, index) => {
//         return {
//           ...suggestion,
//           ...partialSuggestions[index],
//         };
//       });

//       await kv.hset(`suggestions:${inputHash}`, {
//         runStatus: "done",
//         output: suggestions,
//       });
//       store.setKey("suggestions", suggestions);
//     } catch (ex) {
//       console.error(ex);
//       // failed to parse final result, set error
//       await kv.hset(`suggestions:${inputHash}`, {
//         runStatus: "error",
//         error: `not able to parse yaml`,
//         outputRaw,
//       });
//       // shouldnt fail, if does problem with LLM response parsing, figure out how to handle
//     }
//     store.setKey("loading", false);

//     source.close();
//   });
// };

// const chatPrompt = ChatPromptTemplate.fromMessages([
//   [
//     "system",
//     `You will be provided with an input related to food – this can include ingredients, dish names, cooking techniques, or other culinary themes. Your task is to generate six distinct recipes that align with the given input.

// Format your response strictly in YAML. Each recipe suggestion should have both a 'name' and a 'description'.

// Example:
// - name: Recipe Name 1
//   description: Description of recipe 1.
// - name: Recipe Name 2
//   description: Description of recipe 2.
// ... [and so forth for all six recipes]

// Please adhere closely to the format illustrated in the example and ensure you stick strictly to the YAML format, without introducing markdown delimiters or other characters.`,
//   ],
//   ["human", `{prompt}`],
// ]);

// const RunPredictionOllama = async ({
//   prompt,
//   inputHash,
//   store,
// }: {
//   prompt: string;
//   inputHash: string;
//   store: MapStore<StoreProps>;
// }) => {
//   const llm = new Ollama({
//     baseUrl: "http://localhost:11434",
//     model: "mistral",
//   });

//   const chain = chatPrompt.pipe(llm);

//   const input = {
//     prompt,
//   } satisfies SuggestionPredictionInput;
//   await kv.hset(`suggestions:${inputHash}`, { input });

//   const stream = await chain.stream({
//     ...input,
//   });

//   await kv.hset(`suggestions:${inputHash}`, {
//     runStatus: "receiving",
//   });

//   // Listen for changes to the store and save
//   // the suggestions as recipes any time a
//   // new one is completed

//   const createRecipesThatDontExist = async ({
//     suggestions,
//     loading,
//     completeIds,
//   }: StoreProps) => {
//     const isComplete = (suggestionIndex: number) => {
//       const nextSuggestionExists = !!suggestions[suggestionIndex + 1]?.name;
//       const predictionStillRunning = loading;

//       // We know this token is done loading if the suggestion exists
//       // or if the whole thing is done loading (in case of the last one)
//       return nextSuggestionExists || !predictionStillRunning;
//     };

//     await Promise.all(
//       suggestions.map((suggestion, index) => {
//         if (
//           isComplete(index) &&
//           suggestion.id &&
//           !completeIds.has(suggestion.id)
//         ) {
//           completeIds.add(suggestion.id!);

//           const slug = getSlugFromSuggestion(
//             SuggestionSchema.parse(suggestion)
//           );

//           return kv.hset(`recipe:${slug}`, {
//             id: suggestion.id,
//             slug,
//             name: suggestion.name,
//             description: suggestion.description,
//             fromSuggestionsKey: `suggestions:${inputHash}`,
//           });
//         }
//         return Promise.resolve();
//       })
//     );
//   };

//   const listenerOff = store.listen((state) => {
//     createRecipesThatDontExist(state).then(noop);
//   });

//   const charArray: string[] = [];
//   for await (const chunk of stream) {
//     charArray.push.apply(charArray, chunk.split(""));

//     try {
//       const partialResult = charArray.join("");
//       const partialYaml = jsYaml.load(sanitizeOutput(partialResult));
//       console.log(partialYaml);

//       try {
//         const partialSuggestions = z
//           .array(PartialSuggestionSchema)
//           .parse(partialYaml);

//         const nextSuggestions = store
//           .get()
//           .suggestions.map((suggestion, index) => {
//             return {
//               ...suggestion,
//               ...partialSuggestions[index],
//             };
//           });

//         store.setKey("suggestions", nextSuggestions);

//         // todo how do we mark these as completed so we can persist them right away...
//         // we can use selectors to compute...
//       } catch (ex) {
//         // will occasionally fail if there is a null item or 'name' instead of 'name:'
//       }
//     } catch (ex) {
//       // no-op, expected that some will fail
//     }
//   }

//   let yamlOutput: unknown;
//   const outputRaw = charArray.join("").trim();
//   const outputSanitized = sanitizeOutput(outputRaw);
//   try {
//     yamlOutput = jsYaml.load(outputSanitized);
//   } catch (ex) {
//     await kv.hset(`suggestions:${inputHash}`, {
//       runStatus: "error",
//       error: `unable to parse yaml of final result`,
//       outputRaw,
//       outputSanitized,
//     });
//     return;
//   }

//   try {
//     const partialSuggestions = z
//       .array(PartialSuggestionSchema)
//       .parse(yamlOutput);

//     const suggestions = z.array(SuggestionSchema).parse(
//       store.get().suggestions.map((suggestion, index) => {
//         return {
//           ...suggestion,
//           ...partialSuggestions[index],
//         };
//       })
//     );

//     await kv.hset(`suggestions:${inputHash}`, {
//       runStatus: "done",
//       output: suggestions,
//       outputRaw: outputRaw,
//     });
//   } catch (ex) {
//     console.error(ex);
//     // failed to parse final result, set error
//     await kv.hset(`suggestions:${inputHash}`, {
//       runStatus: "error",
//       error: `not able to parse yaml`,
//       outputRaw,
//     });
//     // shouldnt fail, if does problem with LLM response parsing, figure out how to handle
//   }
//   store.setKey("loading", false);
//   listenerOff();

//   return null;
// };

// const RunPredictionReplicate = async ({
//   prompt,
//   inputHash,
//   store,
// }: {
//   prompt: string;
//   inputHash: string;
//   store: MapStore<StoreProps>;
// }) => {
//   const prediction = await createSuggestionsPrediction(prompt);
//   await kv.hset(`suggestions:${inputHash}`, {
//     predictionId: prediction.id,
//     runStatus: "starting",
//   });

//   const streamUrl = prediction?.urls?.stream;
//   assert(
//     streamUrl,
//     "expected stream url in prediction response from replicate"
//   );

//   connectStoreToStream(store, streamUrl, inputHash);

//   return null;
// };

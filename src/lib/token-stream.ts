import { RemixIdeasPredictionInput, SuggestionPredictionInput } from "@/types";
import { eventSourceToAsyncIterable } from "@/lib/event-source";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import Replicate from "replicate";

// Define an abstract class that requires implementers to provide a method for getting a stream
export abstract class TokenStream<T> {
  // Implement a method to construct the template, this must be defined by the subclasses
  protected abstract constructTemplate(input: T): Promise<string>;

  // Implement a method to get the default number of tokens, can be overridden by subclasses
  protected getDefaultTokens(): number {
    // Set a sensible default, or implement logic to determine this dynamically
    return 512;
  }

  public async getStream(input: T): Promise<AsyncIterable<string>> {
    const template = await this.constructTemplate(input);
    // The default tokens number, this should be set as per your requirements or dynamically if needed
    const tokens = this.getDefaultTokens();

    // If the NODE_ENV is production, use the Replicate stream, else use Ollama
    if (process.env.NODE_ENV === "production") {
      return this.getReplicateStream(input, template, tokens);
    } else {
      return this.getOllamaStream(input, template);
    }
  }

  protected abstract constructPrompt(input: T): Promise<string>;

  // Common logic for processing the stream could be placed here
  // ...

  // Common logic for handling different environments' stream sources
  protected async getReplicateStream(
    input: T,
    template: string,
    tokens: number
  ): Promise<AsyncIterable<string>> {
    // ... common logic using Replicate API
    const replicate = new Replicate();
    const prompt = await this.constructPrompt(input);

    try {
      const response = await replicate.predictions.create({
        version: "your-version-hash",
        stream: true,
        input: {
          temperature: 0.2,
          max_new_tokens: tokens,
          prompt_template: template,
          prompt: prompt,
        },
      });
      const { stream } = response.urls;
      // assert(stream, "expected streamUrl");
      if (!stream) throw new Error("expected streamUrl");

      return eventSourceToAsyncIterable(stream);
    } catch (ex) {
      console.error(ex);
      throw ex;
    }
  }

  protected async getOllamaStream(
    input: T,
    template: string
  ): Promise<AsyncIterable<string>> {
    // ... common logic using Ollama API
    const llm = new Ollama({
      baseUrl: "http://localhost:11434",
      model: "mistral-openorca",
    });

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const chain = promptTemplate.pipe(llm);
    const prompt = await this.constructPrompt(input);

    const stream = await chain.stream({
      prompt: prompt,
    });

    return stream as AsyncIterable<string>;
  }
}

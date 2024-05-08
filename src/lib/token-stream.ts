import { privateEnv } from "@/env.secrets";
import { ChatOpenAI } from "@langchain/openai";

import { StringOutputParser } from "@langchain/core/output_parsers";
import { trace } from "@opentelemetry/api";
import { IterableReadableStream } from "langchain/dist/util/stream";
import { z } from "zod";
import { getErrorMessage } from "./error";
import { kv } from "./kv";
import { assert } from "./utils";

export abstract class TokenStream<T> {
  private cacheKey: string | undefined;

  constructor(props?: { cacheKey: string | undefined }) {
    this.cacheKey = props?.cacheKey ? `stream:${props.cacheKey}` : undefined;
  }

  protected getDefaultTokens(): number {
    return 512;
  }

  protected getTemperature(): number {
    return 1;
  }

  public getStream(input: T) {
    const tokens = this.getDefaultTokens();
    return this.getOpenAIStream(input, tokens);
  }

  async *getRunningStream(): AsyncIterable<string> {
    if (!this.cacheKey) {
      throw new Error("Cache key is not set");
    }

    let lastIndex = 0;
    while (true) {
      const chunks = await kv.lrange(this.cacheKey, lastIndex, -1); // Get new chunks since last index
      if (chunks.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every second, adjust as needed
        continue;
      }

      for (const chunk of chunks) {
        yield String(chunk);
      }
      lastIndex += chunks.length;

      // Check if the stream has completed
      const status = await kv.get(`${this.cacheKey}:status`);
      if (status === "done") {
        break;
      }
    }

    const chunks = await kv.lrange(this.cacheKey, lastIndex, -1); // Get new chunks since last index
    for (const chunk of chunks) {
      yield String(chunk);
    }
  }

  public async *getCompletedStream() {
    // todo return AsyncIterable<string> here which is the full length of the complete chunk list, sent all at once
    if (!this.cacheKey) {
      throw new Error("Cache key is not set");
    }

    const chunks = await kv.lrange(this.cacheKey, 0, -1); // Assuming `lrange` gets the entire list
    for (const chunk of chunks) {
      yield String(chunk);
    }
  }

  protected abstract getSystemMessage(input: T): Promise<string>;
  protected abstract getUserMessage(input: T): Promise<string>;

  getStatusKey() {
    return `${this.cacheKey}:status`;
  }

  statusSchema = z.enum(["running", "done", "uninitialized"]);

  public async getStatus() {
    return this.statusSchema.parse(
      (await kv.get(this.getStatusKey())) || "uninitialized"
    );
  }

  private async handleStream(
    rawStream: IterableReadableStream<string>
  ): Promise<AsyncIterable<string>> {
    const cacheKey = this.cacheKey;
    const statusKey = this.getStatusKey();

    // Shared array for batch processing
    let batch: string[] = [];

    // Flag to indicate stream completion
    let streamEnded = false;

    // Batch processing function running in its own loop
    const processStreamInBatches = async () => {
      assert(cacheKey, "expected cacheKey");
      await kv.set(statusKey, "running");

      while (!streamEnded || batch.length > 0) {
        if (batch.length > 0) {
          const batchToProcess = batch.splice(0, batch.length); // Copy and clear the batch
          await kv.rpush(cacheKey, ...batchToProcess);
        }
        await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for 10 ms before checking the batch again, todo may not need this
      }
      await kv.set(statusKey, "done"); // Set the status to "done" when the stream and batch processing are complete
    };

    async function* writeStream() {
      assert(cacheKey, "expected cacheKey");

      for await (const chunk of rawStream) {
        batch.push(chunk);
        yield chunk;
      }

      streamEnded = true;
    }

    if (cacheKey) {
      // Start the batch processing function
      processStreamInBatches();

      // Process the stream
      return writeStream.bind(this)();
    } else {
      // If there's no cacheKey, return the raw stream as is
      return rawStream as AsyncIterable<string>;
    }
  }

  protected async getOpenAIStream(input: T, tokens: number) {
    const outputParser = new StringOutputParser();

    const model = new ChatOpenAI({
      temperature: this.getTemperature(),
      maxTokens: tokens,
      azureOpenAIApiKey: privateEnv.AZURE_OPENAI_API_KEY, // In Node.js defaults to process.env.AZURE_OPENAI_API_KEY
      azureOpenAIApiVersion: "2024-02-01", // In Node.js defaults to process.env.AZURE_OPENAI_API_VERSION
      azureOpenAIApiInstanceName: privateEnv.AZURE_OPENAI_INSTANCE_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_INSTANCE_NAME
      azureOpenAIApiDeploymentName: privateEnv.AZURE_OPENAI_DEPLOYMENT_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME
    });

    // const chat = new ChatOpenAI({
    //   temperature: this.getTemperature(),
    //   maxTokens: tokens,
    //   modelName: "gpt-3.5-turbo-0125",
    // });
    const userMessage = await this.getUserMessage(input);
    const systemMessage = await this.getSystemMessage(input);

    const streamSpan = trace.getTracer("default").startSpan("OpenAIStream");

    try {
      return model.pipe(outputParser).stream([
        ["system", systemMessage],
        ["user", userMessage],
      ]);
    } catch (error) {
      streamSpan.recordException(getErrorMessage(error));
      streamSpan.end();
      throw error;
    }

    // todo update the below commented code to match the docs

    // try {
    //   const rawStream = await model.pipe(outputParser).stream([
    //     ["system", systemMessage],
    //     ["user", userMessage],
    //   ]);

    //   return this.handleStream(rawStream);
    // } catch (error) {
    //   streamSpan.recordException(getErrorMessage(error));
    //   streamSpan.end();
    //   throw error;
    // }
  }
}

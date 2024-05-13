import { privateEnv } from "@/env.secrets";
import { ChatOpenAI } from "@langchain/openai";

import { StringOutputParser } from "@langchain/core/output_parsers";
import { trace } from "@opentelemetry/api";
import { z } from "zod";
import { getErrorMessage } from "./error";
import { kv } from "./kv";

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
  }
}

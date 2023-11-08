import * as jsYaml from "js-yaml";
import * as z from "zod";
import { sanitizeOutput } from "./llm";
import { assert } from "./utils";

export class TokenParser<TSchema extends z.ZodObject<any>> {
  private schema: TSchema;
  private counts = {
    successes: 0,
    yamlFailures: 0,
    schemaFailures: 0,
  };

  constructor(schema: TSchema) {
    this.schema = schema;
  }

  private parseWithSchema<TSchema extends z.ZodObject<any>>(
    schemaToUse: TSchema,
    outputRaw: string,
    throwErrorOnYAMLParse: boolean
  ): z.infer<typeof schemaToUse> | undefined {
    const outputSanitized = sanitizeOutput(outputRaw);
    let outputJSON: unknown;

    try {
      outputJSON = jsYaml.load(outputSanitized);
    } catch (ex) {
      this.counts.yamlFailures++;
      if (throwErrorOnYAMLParse) {
        throw ex;
      }
      return undefined;
    }

    const outputParse = schemaToUse.safeParse(outputJSON);
    if (outputParse.success) {
      this.counts.successes++;
      return outputParse.data;
    } else {
      this.counts.schemaFailures++;
      return undefined;
    }
  }

  public parse(outputRaw: string): z.infer<typeof this.schema> {
    const result = this.parseWithSchema(this.schema, outputRaw, true);
    assert(result, "expected result");
    return result;
  }

  public parsePartial(
    outputRaw: string
  ): z.infer<ReturnType<typeof this.schema.deepPartial>> | undefined {
    const partialSchema = this.schema.deepPartial();
    return this.parseWithSchema(partialSchema, outputRaw, false);
  }

  // Methods to retrieve counts can be added here, if necessary
  public getCounts() {
    return { ...this.counts }; // Return a shallow copy to prevent external mutations
  }
}

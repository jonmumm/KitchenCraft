import * as yaml from "js-yaml";
import { StructuredOutputParser } from "langchain/output_parsers";
import { OutputParserException } from "langchain/schema/output_parser";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

/**
 * A specific type of `StructuredOutputParser` that parses YAML data.
 */
export class YamlStructuredOutputParser<
  T extends z.ZodTypeAny,
> extends StructuredOutputParser<T> {
  private example: z.infer<T>;

  constructor(
    public schema: T,
    example: z.infer<T>
  ) {
    super(schema);
    this.example = example;
  }

  static lc_name() {
    return "YamlStructuredOutputParser";
  }

  /**
   * Returns instructions for outputting a YAML object formatted according
   * to the schema.
   * @returns Instructions for outputting a YAML object formatted according to the schema.
   */
  getFormatInstructions(): string {
    return `Please format your output strictly as YAML. Do NOT include the markdown delimiters or any other extraneous characters. Each entry should consist of a 'name' and a 'description'. 

Correct Example (Do not include markdown delimiters in your response):

- name: Sample Recipe Name 1
  description: Short description of the sample recipe 1.
- name: Sample Recipe Name 2
  description: Short description of the sample recipe 2.
- name: Sample Recipe Name 3
  description: Short description of the sample recipe 3.
- name: Sample Recipe Name 4
  description: Short description of the sample recipe 4.
- name: Sample Recipe Name 5
  description: Short description of the sample recipe 5.
- name: Sample Recipe Name 6
  description: Short description of the sample recipe 6.
  
Your output should strictly adhere to the format shown in the example above.`;
  }

  async parse(text: string): Promise<z.infer<T>> {
    try {
      console.log(text);
      const jsonObj = yaml.load(text);
      return await this.schema.parseAsync(jsonObj);
    } catch (e) {
      throw new OutputParserException(
        `Failed to parse. Text: "${text}". Error: ${e}`,
        text
      );
    }
  }
}

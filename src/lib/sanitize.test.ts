import { describe, expect, it } from "vitest";
import { sanitizeOutput } from "./sanitize"; // Adjust the import path as needed

describe("sanitizeOutput", () => {
  it("should extract a YAML block correctly", () => {
    const response = `
\`\`\`yaml
recipes:
  - name: "My Recipe Name"
    description: "My Description"
\`\`\`
    `;
    expect(sanitizeOutput(response)).toBe(
      'recipes:\n  - name: "My Recipe Name"\n    description: "My Description"'
    );
  });

  it("should handle response with missing ending delimiter", () => {
    const response = `
\`\`\`yaml
key: value
    `;
    expect(sanitizeOutput(response)).toBe("key: value");
  });

  it("should return a message if no YAML block is found", () => {
    const response = `Just some random text`;
    expect(sanitizeOutput(response)).toBe(
      "No YAML block found in the response."
    );
  });

  it("should handle empty YAML blocks", () => {
    const response = `\`\`\`yaml\n\`\`\``;
    expect(sanitizeOutput(response)).toBe("");
  });

  it("should ignore non-YAML code blocks", () => {
    const response = `
\`\`\`json
{
  "key": "value"
}
\`\`\`
    `;
    expect(sanitizeOutput(response)).toBe(
      "No YAML block found in the response."
    );
  });
});

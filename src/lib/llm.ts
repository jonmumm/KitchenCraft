import * as yaml from "js-yaml";

export function sanitizeOutput(output: string): string {
  const startToken = "```yaml";
  const endToken = "```";
  let sanitizedString = output;

  // 1. Remove everything before 'assistant:' string.
  const assistantIndex = output.indexOf("assistant:");
  if (assistantIndex > -1) {
    sanitizedString = sanitizedString.slice(assistantIndex);
  }

  // 2. Correctly extract nested YAML blocks.
  let startIndices = getAllIndicesOf(sanitizedString, startToken);
  let endIndices = getAllIndicesOf(sanitizedString, endToken);

  if (startIndices.length && endIndices.length) {
    // For nested blocks, we will take the first startToken and the last endToken
    sanitizedString = sanitizedString.slice(
      startIndices[0] + startToken.length,
      endIndices[endIndices.length - 1]
    );
  }

  sanitizedString = sanitizedString.trim();

  // 3. Attempt to parse the YAML. If it fails, try corrections.
  try {
    yaml.load(sanitizedString);
    return sanitizedString;
  } catch (error) {
    const corrections = [
      correctUnterminatedStrings,
      removeExtraNewlineAndColon,
    ];

    for (const correctionFn of corrections) {
      try {
        const yamlStr = correctionFn(sanitizedString);
        yaml.load(yamlStr);
        return yamlStr;
      } catch (error) {
        // no-op
      }
    }
  }

  return sanitizedString;
}

function correctUnterminatedStrings(yamlString: string): string {
  return yamlString + '"';
}

function removeExtraNewlineAndColon(yamlString: string): string {
  if (yamlString.startsWith(":\n")) {
    return yamlString.substring(2);
  }
  return yamlString;
}

function getAllIndicesOf(str: string, token: string): number[] {
  let indices = [];
  let idx = str.indexOf(token);
  while (idx != -1) {
    indices.push(idx);
    idx = str.indexOf(token, idx + 1);
  }
  return indices;
}

import * as yaml from "js-yaml";

export function sanitizeOutput(output: string): string {
  const startTokens = ["```yaml", "---"];
  const endToken = "```";

  let startIndex = 0;
  for (const startToken of startTokens) {
    const startTokenIndex = output.indexOf(startToken);
    if (startTokenIndex >= 0) {
      startIndex = startTokenIndex + startToken.length;
      break;
    }
  }

  const endIndex =
    output.lastIndexOf(endToken) > startIndex
      ? output.lastIndexOf(endToken)
      : output.length;
  let sanitizedString = output.slice(startIndex, endIndex).trim();

  // Attempt to parse the YAML. If it fails, try correcting it.
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

// mistrla open-orc tends to add a : line at the beginning ofeach response
function removeExtraNewlineAndColon(yamlString: string): string {
  // If the string starts with a newline and a colon, remove them
  if (yamlString.startsWith(":\n")) {
    return yamlString.substring(2);
  }
  return yamlString;
}

export function sanitizeOutput(response: string): string {
  // Initialize state variables
  let inYamlBlock = false; // Tracks whether we are currently reading inside a YAML block
  let yamlContent = ""; // Accumulates the lines of content found within a YAML block
  let foundYamlBlock = false; // Indicates whether a YAML block start delimiter has been encountered

  // Iterate over each line of the response
  for (const line of response.split("\n")) {
    // Check if the current line marks the beginning of a YAML block
    if (line.trim() === "```yaml") {
      inYamlBlock = true; // Set the flag indicating we're inside a YAML block
      foundYamlBlock = true; // Set the flag indicating a YAML block was found
      continue; // Skip further processing for this line and move to the next
    }

    // Check if the current line marks the end of a YAML block
    if (line.trim() === "```" && inYamlBlock) {
      break; // Exit the loop as we've reached the end of the YAML block
    }

    // If we are inside a YAML block, add the current line to the yamlContent string
    if (inYamlBlock) {
      yamlContent += line + "\n";
    }
  }

  // Trim the accumulated YAML content to remove any leading/trailing whitespace or newlines
  yamlContent = yamlContent.trim();

  // If no YAML block start delimiter was found, return a specific message
  if (foundYamlBlock) {
    // Return the accumulated YAML content (which may be an empty string if the block had no content)
    return yamlContent;
  } else {
    // if we couldnt parse yaml, just return the whole block
    return response.trim();
  }
}

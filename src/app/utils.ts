export const buildInput = ({
  prompt,
  tokens,
}: {
  prompt: string;
  tokens: string[];
}) => {
  return prompt.length ? prompt + ", " + tokens.join(", ") : tokens.join(", ");
};

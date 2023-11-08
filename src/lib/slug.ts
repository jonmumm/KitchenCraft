import { sentenceToSlug } from "./utils";

export const getSlug = ({ id, name }: { id: string; name: string }) => {
  const str = sentenceToSlug(name);
  const idSlug = id.toLowerCase().slice(0, 5);
  const slug = `${idSlug}-${str}`;

  return slug;
};

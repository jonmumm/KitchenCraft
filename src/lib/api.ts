const API_HOST = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : `http://0.0.0.0:3000`;

// todo do zod validations here so we get typed inputs and outputs
export async function getTips(slug: string) {
  const resp = await fetch(`${API_HOST}/api/recipe/${slug}/tips`);

  let text = await resp.text();
  if (!text) {
    throw Error("body is empty");
  }

  // Strip unwanted characters
  text = text.replace(/[",.;]/g, "").trim();

  const items = text.split("\n").filter((item) => item !== "");
  return items;
}

export async function getModifications(slug: string) {
  const resp = await fetch(`${API_HOST}/api/recipe/${slug}/modifications`);

  const text = await resp.text();
  if (!text) {
    throw Error("body is empty");
  }
  const items = text.split("\n").filter((item) => item !== "");
  return items;
}

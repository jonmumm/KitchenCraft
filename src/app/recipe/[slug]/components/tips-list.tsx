import { getTips } from "@/lib/api";

export async function TipsList(props: { slug: string }) {
  const items = await getTips(props.slug);

  return (
    <ul className="list-inside list-disc flex flex-row gap-2 flex-wrap">
      {items.map((tip, index) => {
        // Ensure ‘tip’ is a clean string
        return <li key={index}>{tip}</li>;
      })}
    </ul>
  );
}

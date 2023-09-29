export default function Page({ params }: { params: { slug: string } }) {
  // This page will stream from openai if the recipe doesn't exist yet,
  // otherwise it will fetch it from the key value store
  return <div>My Post: {params.slug}</div>;
}

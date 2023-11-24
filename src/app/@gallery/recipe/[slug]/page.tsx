export default async function Page(props: { params: { slug: string } }) {
  console.log("hi gallery");
  return <>Gallery {props.params.slug}</>;
}

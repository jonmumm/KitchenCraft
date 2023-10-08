type Props = {
  params: { username: string };
};

export default async function Page({ params }: Props) {
  return <h2 className="text-lg font-semibold">{params.username}</h2>;
}

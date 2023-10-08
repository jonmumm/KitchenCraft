import { Header } from "@/app/header";

type Props = {
  params: { username: string };
};

export default async function Page({ params }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <Header />

      <h1>🧪 {params.username}</h1>
      <h2>Chef</h2>
    </div>
  );
}

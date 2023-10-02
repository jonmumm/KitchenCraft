import { RecipeChat } from "@/components/recipe-chat";
import Header from "./header";
import Provider from "./provider";

const getSessionId = (cookies: string) => {
  return "";
};

export default async function Page({ params }: { params: { slug: string } }) {
  console.log(params.slug);
  const userId = undefined;
  const sessionId = await getSessionId("");

  return (
    <Provider userId={userId} sessionId={sessionId} slug={params.slug}>
      <div className="flex flex-col flex-end flex-1 justify-end pt-16 overflow-hidden">
        <Header />
        <RecipeChat />
      </div>
    </Provider>
  );
}

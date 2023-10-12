import { Header } from "../header";
import { RecipeChat } from "./content";
import Navigator from "./navigator";
import Provider from "./provider";

const getSessionId = (cookies: string) => {
  return "";
};

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const userId = undefined;
  const sessionId = await getSessionId("");

  const prompt = searchParams["prompt"];

  return (
    <Provider userId={userId} sessionId={sessionId}>
      <Navigator>
        <div className="max-w-2xl mx-auto">
          <Header />
          <div className={`flex flex-col flex-end w-full p-4 pt-0`}>
            <RecipeChat />
          </div>
        </div>
      </Navigator>
    </Provider>
  );
}

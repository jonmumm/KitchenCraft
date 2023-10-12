import { nanoid } from "nanoid";
import { Content, RecipeChat } from "./content";
import Navigator from "./navigator";
import Provider from "./provider";
import { Header } from "../header";

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
  console.log({ prompt });

  return (
    <Provider userId={userId} sessionId={sessionId}>
      <Navigator>
        <div className="max-w-2xl mx-auto">
          <Header />
          <Content />
        </div>
      </Navigator>
    </Provider>
  );
}

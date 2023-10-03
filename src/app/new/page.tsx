import { RecipeChat } from "@/components/recipe-chat";
import { nanoid } from "nanoid";
import Navigator from "./navigator";
import Provider from "./provider";

const getSessionId = (cookies: string) => {
  return "";
};

export default async function Page() {
  const userId = undefined;
  const sessionId = await getSessionId("");
  const chatId = nanoid();

  return (
    <Provider userId={userId} sessionId={sessionId} chatId={chatId}>
      <Navigator>
        <div className="flex flex-col flex-end flex-1 justify-end pt-16 overflow-hidden">
          <div className="text-center text-muted-foreground my-auto">
            <h2 className="text-2xl">Mise en place</h2>
            <p>Create a plan. Adapt as you go.</p>
          </div>
          <RecipeChat />
        </div>
      </Navigator>
    </Provider>
  );
}

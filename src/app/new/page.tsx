import { RecipeChat } from "@/components/recipe-chat";
import Navigator from "./navigator";
import Provider from "./provider";

const getSessionId = (cookies: string) => {
  return "";
};

export default async function Page() {
  const userId = undefined;
  const sessionId = await getSessionId("");

  return (
    <Provider userId={userId} sessionId={sessionId}>
      <Navigator>
        <div className="flex flex-col flex-end flex-1 justify-end pt-16 overflow-hidden">
          <RecipeChat />
        </div>
      </Navigator>
    </Provider>
  );
}

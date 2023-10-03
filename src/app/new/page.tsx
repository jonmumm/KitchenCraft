import { nanoid } from "nanoid";
import { Content } from "./content";
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
        <Content />
      </Navigator>
    </Provider>
  );
}

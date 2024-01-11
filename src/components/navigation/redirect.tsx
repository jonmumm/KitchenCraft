import { redirect } from "next/navigation";
import { ServerAction } from "../util/server-action";

/* Perform a redirect by calling a server action */
export default async function Redirect(props: {
  to: string;
  onBeforeRedirect: () => Promise<any>;
}) {
  async function action(to: string, onBeforeRedirect: () => Promise<any>) {
    "use server";
    // onBeforeRedirect && (await onBeforeRedirect());
    redirect(to);
  }
  return (
    <ServerAction
      action={action.bind(null, props.to).bind(null, props.onBeforeRedirect)}
    />
  );
}

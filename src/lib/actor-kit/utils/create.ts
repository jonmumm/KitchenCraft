// // import { AssistantCreatePropsSchema } from "@/app/thread/[id]/assistant/schema";
// // import { EditorCreatePropsSchema } from "@/app/thread/[id]/editor/schema";
// // import { ThreadCreatePropsSchema } from "@/app/thread/schema";
// import { z } from "zod";

// type PartyType = "thread" | "editor" | "assistant";

// const createPropsSchemasByType = {
//   assistant: AssistantCreatePropsSchema,
//   thread: ThreadCreatePropsSchema,
//   editor: EditorCreatePropsSchema,
// };

// // const { NEXTAUTH_URL } = z
// //   .object({
// //     NEXTAUTH_URL: z.string(),
// //   })
// //   .parse(process.env);

// export const createParty = <TPartyType extends PartyType>({
//   host,
//   party,
//   token,
//   id,
//   props,
// }: {
//   host: string;
//   party: TPartyType;
//   token?: string;
//   id: string;
//   props: z.infer<(typeof createPropsSchemasByType)[TPartyType]>;
// }) => {
//   const headers: Record<string, string> = {};
//   if (token) {
//     headers["Authorization"] = `Bearer ${token}`;
//   }

//   const protocol =
//     host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
//       ? `http://`
//       : `https://`;

//   return fetch(`${protocol}${host}/parties/${party}/${id}`, {
//     method: "POST",
//     headers,
//     body: JSON.stringify(props),
//   });
// };

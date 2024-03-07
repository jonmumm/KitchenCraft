// // import { PARTYKIT_URL } from "@/app/env";
// import { PromptSnaphotSchema } from "@/app/thread/[id]/prompt/schema";
// import { ThreadSnapshotSchema } from "@/app/thread/schema";
// import { z } from "zod";
// import { PARTYKIT_URL } from "../constants";

// type PartyType = "thread" | "prompt";

// const snapshotSchemasByType = {
//   thread: ThreadSnapshotSchema,
//   prompt: PromptSnaphotSchema,
// };

// export const getSnapshot = async <TPartyType extends PartyType>({
//   party,
//   token,
//   id,
// }: {
//   party: TPartyType;
//   token?: string;
//   id: string;
// }) => {
//   const headers: Record<string, string> = {};
//   if (token) {
//     headers["Authorization"] = `Bearer ${token}`;
//   }

//   const resp = await fetch(`${PARTYKIT_URL}/parties/${party}/${id}`, {
//     method: "GET",
//     headers,
//   });
//   const schema = snapshotSchemasByType[party];

//   return schema.parse(await resp.json()) as z.infer<typeof schema>;
// };

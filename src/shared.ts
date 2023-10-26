import { AnyActor } from "xstate";

export const actorMap = new Map<String, AnyActor>();

// todo eventually put this behind a redis lock so no web-server
// can have the actor at more than one time
export const getActor = async <TActor extends AnyActor>(actorId: string) => {
  console.log("get actor", { actorId }, actorMap.size);
  return actorMap.get(actorId) as TActor;
};

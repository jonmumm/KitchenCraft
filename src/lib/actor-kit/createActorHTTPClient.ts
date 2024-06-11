import { AppEventSchema, SystemEventSchema } from "@/schema";
import { Caller } from "@/types";
import { Actor, AnyStateMachine, SnapshotFrom } from "xstate";
import { z } from "zod";
import { createAccessToken } from "../session";
import { API_SERVER_URL } from "./constants";

const GuestCallerEventSchema = AppEventSchema;
const UserCallerEventSchema = AppEventSchema;
const SystemCallerEventSchema = SystemEventSchema;

type GuestCallerEvent = z.infer<typeof GuestCallerEventSchema>;
type UserCallerEvent = z.infer<typeof UserCallerEventSchema>;
type SystemCallerEvent = z.infer<typeof SystemCallerEventSchema>;

type EventMap = {
  guest: GuestCallerEvent;
  user: UserCallerEvent;
  system: SystemCallerEvent;
};

export const createActorHTTPClient = <
  TMachine extends AnyStateMachine,
  TCallerType extends keyof EventMap,
>(props: {
  type: "page_session" | "session" | "user";
  caller: Caller & { type: TCallerType };
}) => {
  const get = async (id: string, input: Record<string, string>) => {
    const token = await createAccessToken({
      actorId: id,
      callerId: props.caller.id,
      callerType: props.caller.type,
      type: props.type,
    });
    const resp = await fetch(
      `${API_SERVER_URL}/parties/${props.type}/${id}?input=${encodeURIComponent(
        JSON.stringify(input)
      )}`,
      {
        next: { revalidate: 0 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const responseSchema = z.object({
      connectionId: z.string(),
      token: z.string(),
      snapshot: z.custom<SnapshotFrom<Actor<TMachine>>>(),
    });

    return responseSchema.parse(await resp.json());
  };

  const getSnapshot = async (id: string, input: Record<string, string>) => {
    return (await get(id, input)).snapshot as SnapshotFrom<Actor<TMachine>>;
  };

  const send = async (id: string, event: EventMap[TCallerType]) => {
    const token = await createAccessToken({
      actorId: id,
      callerId: props.caller.id,
      callerType: props.caller.type,
      type: props.type,
    });
    const resp = await fetch(`${API_SERVER_URL}/parties/${props.type}/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });

    return await resp.json();
  };

  return { get, getSnapshot, send };
};

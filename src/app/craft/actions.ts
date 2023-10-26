"use server";

import { actorMap, getActor } from "@/shared";
import { AppEvent } from "@/types";
import { kv } from "@vercel/kv";
import { AnyStateMachine, createMachine } from "xstate";


const machine = createMachine({
  id: "AppMachine",
  initial: "Idle",
  types: {
    events: {} as AppEvent,
  },
  states: {
    Idle: {
      on: {
        SUBMIT: "Submitting",
      },
    },
    Submitting: {
      entry: console.log,
    },
  },
});

export const sendAction = async (actorId: string, action: AppEvent) => {
  // Get a lock
  // Send an event
  // Release the lock
  // const state = kv.hgetall(`actor:${actorId}:state`);
  // const
  // console.log(actorId, actorMap.keys());
  // const actor = await getActor(actorId);
  // actor.send(action);
  // await new Promise((resolve) => {
  //   setTimeout(resolve, 3000);
  // });
  // return { success: true };
};

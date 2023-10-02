import { useLayoutEffect, useRef } from "react";
import { AnyActorRef } from "xstate";

export const useOnDone = <TActor extends AnyActorRef>(
  actor: TActor,
  cb: () => void
) => {
  const doneRef = useRef(actor.getSnapshot().status === "done");

  useLayoutEffect(() => {
    if (doneRef.current) {
      return cb();
    }

    // todo check if actor is already done...
    actor.subscribe((e) => {
      if (!doneRef.current && actor.getSnapshot().status === "done") {
        doneRef.current = true;
      }
    });
  }, [actor, cb, doneRef]);
};

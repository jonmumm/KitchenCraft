import { useLayoutEffect, useRef } from "react";
import { Actor, AnyActorRef } from "xstate";

export const useOnMatches = <TActor extends AnyActorRef>(
  actor: TActor,
  matcher: (state: ReturnType<TActor["getSnapshot"]>) => boolean,
  cb: (state: ReturnType<TActor["getSnapshot"]>) => void
) => {
  const didMatchRef = useRef(matcher(actor.getSnapshot()));

  useLayoutEffect(() => {
    if (didMatchRef.current) {
      cb(actor.getSnapshot());
    }

    return actor.subscribe((e) => {
      const doesMatch = matcher(actor.getSnapshot());
      if (!didMatchRef.current && doesMatch) {
        cb(actor.getSnapshot());
      }
      didMatchRef.current = doesMatch;
    }).unsubscribe;
  }, [actor, cb, didMatchRef, matcher]);
};

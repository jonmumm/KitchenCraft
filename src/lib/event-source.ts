import EventSource from "@sanity/eventsource";

export function eventSourceToAsyncIterable(
  stream: string
): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<string> {
      let eventQueue: any[] = [];
      let resolve: Function | null = null;
      const source = new EventSource(stream, { withCredentials: true });

      source.addEventListener("output", (e) => {
        // console.log(e.data);
        if (resolve) {
          resolve({ value: e.data, done: false });
          resolve = null;
        } else {
          eventQueue.push(e.data);
        }
      });

      source.addEventListener("error", () => {
        if (resolve) {
          resolve({ value: null, done: true });
          resolve = null;
        }
      });

      source.addEventListener("done", () => {
        if (resolve) {
          resolve({ value: null, done: true });
          resolve = null;
        }
        source.close();
      });

      return {
        async next() {
          if (eventQueue.length > 0) {
            return { value: eventQueue.shift(), done: false };
          }

          return new Promise((res) => {
            resolve = res;
          });
        },
      };
    },
  };
}

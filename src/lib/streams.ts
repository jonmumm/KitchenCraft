// export const writeToStream = async (
//   stream: AsyncIterable<string>,
//   writer: WritableStreamDefaultWriter
// ) => {
//   for await (const chunk of stream) {
//     await writeChunk(writer, chunk);
//   }

//   await writer.ready;
//   await writer.close();
// };

export class StreamingTextResponse extends Response {
  constructor(stream: ReadableStream<any>) {
    super(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Content-Encoding": "none",
      },
    });
  }
}

export const writeChunk = async (
  writer: WritableStreamDefaultWriter<any>,
  chunk: string
) => {
  await writer.ready;
  await writer.write("event: message\n");
  await writer.write("data:" + JSON.stringify(chunk) + "\n\n");
};

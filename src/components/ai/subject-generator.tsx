import { partialUtil } from "@/lib/partial"; // Adjust the import path
import { ComponentProps, Suspense } from "react";
import { Subject } from "rxjs";
import { z } from "zod";
import Generator from "./generator";

// Infer props from Generator component
type GeneratorProps<TOutput extends z.ZodRawShape> = ComponentProps<
  typeof Generator<TOutput, any>
>;

interface SubjectGeneratorProps<TOutput extends z.ZodRawShape>
  extends Omit<
    GeneratorProps<TOutput>,
    "onProgress" | "onError" | "onComplete"
  > {
  subject: Subject<z.infer<partialUtil.DeepPartial<z.ZodObject<TOutput>>>>;
}

const SubjectGenerator = <TOutput extends z.ZodRawShape>({
  stream,
  schema,
  subject,
  ...rest
}: SubjectGeneratorProps<TOutput>) => {
  return (
    <Suspense fallback={null}>
      <Generator<
        TOutput,
        z.infer<partialUtil.DeepPartial<z.ZodObject<TOutput>>>
      >
        stream={stream}
        schema={schema}
        onProgress={(output) => subject.next(output)}
        onError={(error, outputRaw) => subject.error(error)}
        onComplete={(output) => {
          subject.next(output);
          subject.complete();
        }}
        {...rest}
      />
    </Suspense>
  );
};

export default SubjectGenerator;

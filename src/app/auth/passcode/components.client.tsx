"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChangeEventHandler,
  ClipboardEventHandler,
  useCallback,
  useEffect,
  useState,
} from "react";

const formSchema = z.object({
  token: z.string().length(5, { message: "Passcode must be 5 characters" }),
});

export function PasscodeForm(props: {
  gmailLink?: string;
  email: string;
  submit: (formData: FormData) => Promise<void>;
}) {
  const [disabled, setDisabled] = useState(false);
  const params = useSearchParams();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
    },
  });

  const [showGMailLink, setShowGMailLink] = useState(!!props.gmailLink);

  const GmailLink = () => {
    useEffect(() => {
      const handleTabBlur = () => setShowGMailLink(false);
      window.addEventListener("blur", handleTabBlur);

      return () => {
        window.removeEventListener("blur", handleTabBlur);
      };
    }, []);

    if (!props.gmailLink || !showGMailLink) {
      return null;
    }

    return (
      <Link href={props.gmailLink} target="_blank">
        <Button
          type="button"
          variant="secondary"
          className="w-full flex flex-row items-center-justify-center gap-1"
          size="lg"
        >
          <span>Open Gmail</span>
          <ExternalLinkIcon size={14} />
        </Button>
      </Link>
    );
  };

  const handleOnPaste: ClipboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const result = formSchema.safeParse({
        token: event.clipboardData.getData("text"),
      });
      if (result.success) {
        setDisabled(true);
        const data = new FormData();
        data.set("token", result.data.token);
        props.submit(data);
      }
    },
    [props.submit, setDisabled]
  );

  const onSubmit = useCallback(
    (data: z.infer<typeof formSchema>) => {
      setDisabled(true);
      const formData = new FormData();
      formData.set("token", data.token);
      props.submit(formData);
    },
    [props.submit, setDisabled]
  );

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const { value } = event.target;
      const newValue = value.toUpperCase();
      form.setValue("token", newValue);
    },
    [form]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const inputElement = document.querySelector(
          "#code"
        ) as HTMLInputElement | null;
        if (inputElement) {
          inputElement.focus();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <Form {...form}>
      <form
        action={props.submit}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="token"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input
                  id="code"
                  autoFocus={!showGMailLink}
                  disabled={disabled}
                  onPaste={handleOnPaste}
                  type="text"
                  placeholder="Enter your 5-letter code"
                  {...field}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormDescription>
                Enter the 5-letter code you received at{" "}
                <span className="italic">{params.get("email")}</span>.
              </FormDescription>
              {fieldState.error && (
                <FormMessage>{fieldState.error.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2">
          <Button
            disabled={disabled}
            type="submit"
            className="w-full"
            size="lg"
          >
            {disabled ? "Loading..." : "Submit"}
          </Button>
          <GmailLink />
        </div>
      </form>
    </Form>
  );
}

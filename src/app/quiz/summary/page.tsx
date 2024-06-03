"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Input } from "@/components/input";
import { Button } from "@/components/input/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/input/form";
import AnimatedText from "@/components/typography/animated-text";
import Delay from "@/components/util/delay";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export default function Results() {
  const router = useRouter();
  const params = useSearchParams();
  const [disabled, setDisabled] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      setDisabled(true);
      try {
        // Simulate API call
        console.log("Saving email:", data.email);
        // Redirect to another page if needed
      } catch (error) {
        console.error("Saving email failed:", error);
        setDisabled(false);
      }
    },
    [router, params]
  );

  const isPendingEmailInput = true;

  return (
    <div className="max-w-md mx-auto w-full px-4 flex flex-col gap-4">
      <div className="flex flex-col justify-center h-full md:mx-auto rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 w-full p-4">
        <h2 className="text-2xl font-semibold mb-2 leading-10">
          <AnimatedText
            text="Thank You"
            baseSpeed={60}
            punctDelay={600}
            delay={0}
          />
        </h2>
        <div className="text-lg mb-4 font-semibold leading-7">
          <AnimatedText
            text="For sharing your preferences"
            baseSpeed={50}
            punctDelay={300}
            delay={500}
          />
        </div>
        <div className="text-lg font-semibold leading-7 animate-pulse">
          <AnimatedText
            text="Your Chef Profile is building."
            baseSpeed={50}
            punctDelay={300}
            delay={2000}
          />
        </div>
      </div>
      <Delay delay={3000}>
        {isPendingEmailInput && (
          <Card>
            <CardHeader>
              <CardTitle>Save Chef Profile</CardTitle>
              <CardDescription>
                Provide your email to save quiz results to your personalized
                chef profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            autoFocus
                            autoComplete="email"
                            disabled={disabled}
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        {/* <FormDescription>
                          Send yourself a login code.
                        </FormDescription> */}
                        {fieldState.error && (
                          <FormMessage>{fieldState.error.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  <Button
                    disabled={disabled}
                    type="submit"
                    className="w-full"
                    size="xl"
                  >
                    {disabled ? "Loading..." : "Submit"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </Delay>
    </div>
  );
}

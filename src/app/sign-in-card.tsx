"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { SignInForm } from "@/components/forms/sign-in/components.client";
import { Button } from "@/components/input/button";
import { XIcon } from "lucide-react";
import "./embla.css";

export const SignInCard = () => {
  return (
    <Card>
      <CardHeader className="relative flex flex-row justify-between">
        <div>
          <CardTitle>Sign In</CardTitle>
          <CardDescription className="mt-2">
            Enter your email to receive a link.
          </CardDescription>
        </div>
        <div>
          <Button event={{ type: "CANCEL" }} variant="ghost">
            <XIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  );
};

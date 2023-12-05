"use client";

import { Input } from "@/components/input";

export const EditName = ({ defaultValue }: { defaultValue: string }) => {
  return <Input value={defaultValue} className="text-2xl" name="name" />;
};

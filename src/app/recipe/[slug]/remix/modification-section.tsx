"use client";

import { ModificationSchema } from "@/schema";
import { parseAsStringEnum, useQueryState } from "next-usequerystate";

export const ModificationSection = () => {
  const [modification] = useQueryState("modification", {
    parse: ModificationSchema.parse,
  });

  switch (modification) {
    case "substitute":
      return <SubstituteModification />;
    case "scale":
      return <ScaleModification />;
    case "equipment":
      return <EquipmentModification />;
    case "dietary":
      return <DietaryModification />;
    default:
      return null;
  }
};

const EquipmentModification = async () => {
  return <>equipment</>;
};

const DietaryModification = async () => {
  return <>dietary</>;
};

const ScaleModification = async () => {
  return <>scale</>;
};

const SubstituteModification = async () => {
  return <>substitute</>;
};

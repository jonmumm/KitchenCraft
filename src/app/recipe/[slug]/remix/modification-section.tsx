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
    case "servings":
      return <ServingsModification />;
    case "equipment":
      return <EquipmentModification />;
    case "dietary":
      return <DietaryModification />;
    default:
      return null;
  }
  //   const modification = ModificationSchema.parse(
  //     props.searchParams["modification"]
  //   );
  return <>{modification}</>;
};

const EquipmentModification = async () => {
  return <>equipment</>;
};

const DietaryModification = async () => {
  return <>dietary</>;
};

const ServingsModification = async () => {
  return <>servings</>;
};

const SubstituteModification = async () => {
  return <>substitute</>;
};

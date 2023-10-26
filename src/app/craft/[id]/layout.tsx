import { Header } from "@/app/header";
import { ReactNode } from "react";

export default async function Layout({
  children,
  searchParams,
}: {
  children: ReactNode;
  searchParams: Record<string, string>;
}) {
  console.log("layout", { searchParams });
  return (
    <>
      {/* <Header /> */}
      {/* <h1>Layout</h1> */}
      {children}
    </>
  );
}

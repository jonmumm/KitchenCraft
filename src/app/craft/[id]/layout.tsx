import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* <Header /> */}
      {/* <h1>Layout</h1> */}
      {children}
    </>
  );
}

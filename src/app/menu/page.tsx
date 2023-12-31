import { MainMenu } from "./components";

export default async function Page() {
  return (
    <div className="flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-3">
        <MainMenu />
      </div>
    </div>
  );
}

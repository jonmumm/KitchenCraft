import StepsIndicator from "../components";

export default async function Page() {
  return <StepsIndicator showSeparator={false} showBack currentStep="Preferences" />;
}

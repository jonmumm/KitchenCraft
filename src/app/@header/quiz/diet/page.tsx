import StepsIndicator from "../components";

export default async function Page(props: { params: { slug: string } }) {
  return <StepsIndicator currentStep="Diet" />;
}

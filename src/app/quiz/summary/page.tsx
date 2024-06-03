"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import AnimatedText from "@/components/typography/animated-text";

export default function Results() {
  // const router = useRouter();

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     router.push("/"); // Assuming "/home" is the path where users will see their personalized recipes
  //   }, 5000); // Gives users some time to read the message before redirecting
  //   return () => clearTimeout(timer);
  // }, [router]);

  return (
    <div className="max-w-md mx-auto w-full px-4">
      <div className="flex flex-col justify-center h-full md:mx-auto rounded-xl bg-purple-600 w-full p-4">
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
    </div>
  );
}

const EnterEmailStep = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Save Chef Profile</CardTitle>
        <CardDescription>
          Enter your email to create your personalized chef profile.
        </CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
};

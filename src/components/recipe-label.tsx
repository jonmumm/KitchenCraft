import { cn } from "@/lib/utils";

export default function RecipeLabel({
  className,
  name,
  description,
}: {
  className?: string;
  name: string;
  description: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <h3 className="font-semibold text-lg">{name}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );
}

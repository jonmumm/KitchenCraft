import { Badge } from "@/components/display/badge";
import { useCombinedSelector } from "@/hooks/useCombinedSelector";
import { selectPathForCurrentList } from "@/selectors/combined.selectors";
import { ClipboardCheckIcon } from "lucide-react";
import Link from "next/link";

export const ListUrlCopiedToast = ({ listSlug }: { listSlug: string }) => {
  const path = useCombinedSelector(selectPathForCurrentList);

  return (
    <Link
      target="_blank"
      href={path}
      className="flex flex-row items-center gap-2 w-full"
    >
      <span className="text-xl flex-shrink-0">
        <ClipboardCheckIcon />
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center text-sm">
          <span className="font-medium flex-shrink-0 whitespace-nowrap">
            Link Copied{" "}
          </span>
        </div>
        <span className="font-medium text-base text-blue-600 hover:underline">
          {path}
        </span>
      </div>
      <Badge
        variant="secondary"
        className="flex-shrink-0 ml-2"
        //   event={{
        //     type: "CHOOSE_LISTS",
        //     recipeId: addedRecipeId,
        //   }}
      >
        View
      </Badge>
    </Link>
  );
};

import { Card } from "@/components/display/card";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { ExternalLinkIcon } from "lucide-react";

export default async function AdCard(props: {
  adInstanceId: string;
  index: number;
}) {
  const { adInstanceId, index } = props;
  // const sessionActorClient = await getSessionActorClient();
  // const uniqueId = await getUniqueId();
  // sessionActorClient
  //   .send(uniqueId, {
  //     type: "INIT_AD_INSTANCE",
  //     id: props.adInstanceId,
  //     context: {
  //       type: "home_feed",
  //       index,
  //     },
  //   })
  //   .then(noop);

  return (
    <Card
      // className="flex flex-col gap-3 max-w-2xl w-full mx-auto p-4 rounded-2xl border-none shadow-none sm:border-solid sm:shadow-md sm:hover:shadow-lg"
      className="w-48 h-80 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col"
      eventOnView={{
        type: "VIEW_AD_INSTANCE",
        adInstanceId,
      }}
    >
      <div className="relative">
        <Skeleton className="w-full h-56" />
      </div>
      <div className="p-4 bg-slate-50 text-slate-900 flex-1 flex items-center justify-center text-sm">
        <h4 className="font-semibold text-md mb-2 line-clamp-3 flex-1">
          <SkeletonSentence className="h-6" numWords={3} />
          {/* {product.name}{" "} */}
          <ExternalLinkIcon className="inline mb-1" size={14} />
        </h4>
      </div>
    </Card>
  );
}

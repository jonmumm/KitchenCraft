"use client";

import { CloudflareImage } from "@/components/cloudflare-image";
import { useEventHandler } from "@/hooks/useEventHandler";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export const MediaPreview = ({
  recipeId,
  initialMediaIds,
}: {
  recipeId: string;
  initialMediaIds?: string[];
}) => {
  const [mediaIds, setMediaIds] = useState(initialMediaIds || []);
  const [uploadingMediaId, setUploadingMediaId] = useState<string | null>(null);

  const currentMediaIds = usePageSessionSelector(
    (snapshot) => snapshot.context.recipes[recipeId]?.mediaIds
  );

  useEventHandler("SELECT_RECIPE_MEDIA", (event) => {
    if (event.recipeId === recipeId) {
      setUploadingMediaId(event.mediaId);
    }
  });

  const handleUploadMediaComplete = useCallback(
    (event: { mediaId: string }) => {
      if (event.mediaId === uploadingMediaId) {
        setUploadingMediaId(null);
      }
    },
    [uploadingMediaId]
  );
  useEventHandler("UPLOAD_MEDIA_COMPLETE", handleUploadMediaComplete);

  useEffect(() => {
    if (uploadingMediaId && mediaIds.length === 0) {
      setMediaIds([uploadingMediaId]);
    } else if (
      currentMediaIds &&
      currentMediaIds.length > 0 &&
      initialMediaIds &&
      initialMediaIds.length != currentMediaIds.length
    ) {
      setMediaIds(currentMediaIds);
    }
  }, [uploadingMediaId, currentMediaIds, mediaIds, initialMediaIds]);

  const previewMediaId = mediaIds[0];

  if (!previewMediaId) {
    return null;
  }

  const isUploading = previewMediaId === uploadingMediaId;

  return (
    <div className={cn(`relative w-full aspect-square`)}>
      <div className="mx-auto h-full">
        <div className="flex h-full">
          <div className="h-full aspect-square rounded-xl relative">
            {isUploading ? (
              <div className="h-full w-full flex items-center justify-center bg-gray-200">
                <Loader2Icon className="animate-spin text-gray-500" size={48} />
              </div>
            ) : (
              <CloudflareImage
                mediaId={previewMediaId}
                width={1000}
                height={1000}
                fit="cover"
                alt="Recipe Preview"
                className="h-full w-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

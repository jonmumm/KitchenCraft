import { CLOUDFLARE_ACCOUNT_HASH } from "@/constants";

const normalizeSrc = (src: string): string => {
  return src.startsWith("/") ? src.slice(1) : src;
};

interface ImageLoaderProps {
  src: string;
  width?: number;
  quality?: number;
  height?: number;
  blur?: number; // between 1 and 250
}

const cloudflareLoader = ({
  src,
  width,
  height,
  quality,
  blur,
  ...props
}: ImageLoaderProps): string => {
  console.log({ props, src, width, height, quality });
  const params = [];
  if (width) params.push(`w=${width}`);
  if (quality) params.push(`quality=${quality}`);
  if (blur && blur >= 1 && blur <= 250) params.push(`blur=${blur}`);

  const paramsString = params.length > 0 ? params.join(",") : "public";

  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${normalizeSrc(
    src
  )}/${paramsString}`;
};

export default cloudflareLoader;

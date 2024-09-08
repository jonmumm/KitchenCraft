import { ComponentProps } from "react";
import { CLOUDFLARE_ACCOUNT_HASH } from "@/constants";

interface CloudflareImageProps extends Omit<ComponentProps<"img">, "src" | "srcSet" | "sizes"> {
  mediaId: string;
  width?: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  format?: 'auto' | 'webp' | 'avif' | 'jpeg';
  blur?: number;
  sizes?: string;
}

export const CloudflareImage: React.FC<CloudflareImageProps> = ({
  mediaId,
  alt,
  width,
  height,
  fit,
  format,
  blur,
  loading,
  sizes = "(max-width: 768px) 100vw, 768px",
  ...props
}) => {
  const params = [
    // width !== undefined && `w=${width}`,
    // height !== undefined && `h=${height}`,
    fit && `fit=${fit}`,
    format && `format=${format}`,
    blur !== undefined && `blur=${blur}`,
  ].filter(Boolean);

  const baseUrl = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${btoa(mediaId)}`;
  const src = params.length ? `${baseUrl}/${params.join(',')}` : baseUrl;

  const srcSet = [320, 640, 960, 1280, 1600, 1920]
    .map((w) => {
      const aspectRatio = width && height ? width / height : null;
      const h = aspectRatio ? Math.round(w / aspectRatio) : undefined;
      const sizeParams = [`w=${w}`, h && `h=${h}`].filter(Boolean);
      return `${baseUrl}/${[...params, ...sizeParams].join(',')} ${w}w`;
    })
    .join(", ");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading={loading}
      {...props}
    />
  );
};

"use client";
import { Pagination, Navigation } from "swiper/modules";

import { UploadedMedia } from "@/app/recipe/[slug]/media/types";
import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import { deepMap, map } from "nanostores";
import Image from "next/image";
import {
  ComponentProps,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useStore } from "@nanostores/react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./styles.css";

const CarouselItem = ({
  color,
  children,
}: {
  color: string;
  children?: ReactNode;
}) => {
  return (
    <div className="w-full" style={{ backgroundColor: color }}>
      {color}
    </div>
  );
};

export const ImageCarousel = ({
  children, // initialMedia,
  // previewMediaIds,
}: {
  children?: ReactNode;
  // initialMedia: UploadedMedia;
  // previewMediaIds: string[];
}) => {
  // const store = useState(
  //   deepMap({
  //     media: {
  //       [initialMedia.id]: initialMedia,
  //     } as Record<string, UploadedMedia>,
  //   })
  // );
  //   previewMediaIds

  return (
    <Swiper
      slidesPerView={1}
      onSlideChange={() => console.log("event")}
      onSwiper={(swiper) => console.log(swiper)}
      // pagination={{
      //   type: "progressbar",
      // }}
      // navigation={true}
      // modules={[Pagination, Navigation]}
      className="mySwiper"
    >
      <SwiperSlide>1</SwiperSlide>
      <SwiperSlide>2</SwiperSlide>
      <SwiperSlide>3</SwiperSlide>
      <SwiperSlide>4</SwiperSlide>
    </Swiper>
  );
  // return (
  //   <div style={{ background: "white" }} className="w-full aspect-square">
  //     <Image
  //       alt={`Main Carousel Image`}
  //       src={initialMedia.url}
  //       width={initialMedia.metadata.width}
  //       height={initialMedia.metadata.height}
  //       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  //       style={{
  //         width: "100%",
  //         position: "absolute",
  //         top: "50%",
  //         transform: "translateY(-50%)",
  //       }}
  //     />
  //   </div>
  // );
};

const RecipeLinkContext = createContext(map({ pressed: false }));

export const RecipeLink = ({
  className,
  children,
  ...props
}: ComponentProps<typeof Link>) => {
  const [store] = useState(
    map({
      pressed: false,
    })
  );
  const handlePress = useCallback(() => {
    store.setKey("pressed", true);
  }, [store]);
  const { pressed } = useStore(store);

  return (
    <RecipeLinkContext.Provider value={store}>
      <Link
        onClick={handlePress}
        className={cn("w-full block flex-1", className)}
        {...props}
      >
        {children}
      </Link>
    </RecipeLinkContext.Provider>
  );
};

export const RecipeCardButton = () => {
  const store = useContext(RecipeLinkContext);
  const { pressed } = useStore(store);

  return (
    <Button disabled={pressed} size="icon" variant="ghost">
      {pressed ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <ChevronRightIcon />
      )}
    </Button>
  );
};

export const ImageCarouselItem = ({
  media,
  recipeName,
}: {
  media: UploadedMedia;
  recipeName: string;
}) => {
  return (
    <SwiperSlide>
      {media.url}
      <Button>111</Button>
      {/* <Image
        alt={`${recipeName}`}
        src={media.url}
        width={media.metadata.width}
        height={media.metadata.height}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{
          width: "100%",
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      /> */}
    </SwiperSlide>
  );
};

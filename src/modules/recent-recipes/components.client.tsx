"use client";

import { UploadedMedia } from "@/app/recipe/[slug]/media/types";
import { cn } from "@/lib/utils";
import { useStore } from "@nanostores/react";
import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import { map } from "nanostores";
import Link from "next/link";
import {
  ComponentProps,
  ComponentPropsWithRef,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { Button } from "../../components/input/button";

import Image from "next/image";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./styles.css";
import { Badge } from "../../components/display/badge";
import { Pagination } from "swiper/modules";
import { MotionImage } from "../../components/motion-image";

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

export const RecipeMediaCarousel = ({
  initialMedia,
  getNext,
}: {
  initialMedia: UploadedMedia[];
  getNext: () => Promise<ReactNode>;
}) => {
  const CurrentIndexBadge = () => {
    const swiper = useSwiper();
    const [index, setIndex] = useState(swiper.activeIndex);

    useEffect(() => {
      const listener = (s: typeof swiper) => setIndex(s.activeIndex);
      swiper.on("activeIndexChange", listener);
      return () => {
        swiper.off("activeIndexChange", listener);
      };
    });

    return (
      <Badge className="z-30 absolute bottom-3 right-2" variant="secondary">
        {index + 1} / {initialMedia.length}
      </Badge>
    );
  };

  return (
    <Swiper
      slidesPerView={1}
      className="w-full aspect-square absolute top-0 left-0"
      pagination={{ dynamicBullets: true }}
      modules={[Pagination]}
    >
      {initialMedia.map((item, index) => {
        return (
          <SwiperSlide key={item.id}>
            <Image
              priority={index === 0}
              // layoutId={`${item.id}-${index}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={item.url}
              width={item.metadata.width}
              height={item.metadata.height}
              alt={item.pathname}
              style={{ objectFit: "cover" }}
            />
          </SwiperSlide>
        );
      })}
      <CurrentIndexBadge />
    </Swiper>
  );
};

export const RecipeMediaCarouselItem = (
  props: ComponentPropsWithRef<typeof SwiperSlide>
) => {
  return <SwiperSlide {...props}>{props.children}</SwiperSlide>;
};

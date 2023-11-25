"use client";

import { Header } from "@/app/header";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";

import { UploadedMedia } from "../media/types";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";

export const MediaCarousel = ({
  previewMedia,
}: {
  previewMedia: UploadedMedia[];
}) => {
  // const {
  //   carouselFragment,
  //   slideToPrevItem,
  //   slideToNextItem
  // } = useSpringCarousel({
  //   itemsPerSlide: 3,
  //   withLoop: true,
  //   startEndGutter: 24,
  //   items: mockedItems.map((i) => ({
  //     id: i.id,
  //     renderItem: (
  //       <CarouselItem color={i.color}>
  //         {i.title}
  //       </CarouselItem>
  //     ),
  //   })),
  // });

  const mainMedia = previewMedia[0];
  if (!mainMedia) {
    console.error("Expected media but not found");
    return null;
  }
  console.log({ previewMedia });

  return (
    <div className="w-full aspect-square overflow-hidden relative rounded-b-xl shadow-md">
      {/* <Header className="absolute left-0 right-0 top-0" /> */}
      <Swiper
        className="h-full"
        pagination={{ dynamicBullets: true }}
        modules={[Pagination]}
      >
        {previewMedia.map((media) => (
          <SwiperSlide className="h-full" key={media.id}>
            <Image
              src={media.url}
              priority
              width={media.metadata.width}
              height={media.metadata.width}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt="Main media"
              style={{ objectFit: "cover" }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      {/* <Image
        src={mainMedia.url}
        priority
        width={mainMedia.metadata.width}
        height={mainMedia.metadata.width}
        sizes="100vw"
        alt="Main media"
        style={{ objectFit: "contain" }}
      /> */}
    </div>
  );
};

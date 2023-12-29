"use client";

import { usePathname } from "next/navigation";
import React, { RefObject, useEffect } from "react";

interface CarouselScrollerProps {
  scrollOffset?: number;
  currentTag: string;
}

const CarouselScroller: React.FC<CarouselScrollerProps> = ({
  scrollOffset = 0,
  currentTag,
}) => {
  const pathname = usePathname();

  useEffect(() => {
    const carouselEl = document.querySelector("#tag-carousel");
    if (currentTag && carouselEl) {
      const targetElement = carouselEl.querySelector(
        `[data-tag="${currentTag}"]`
      );
      console.log(targetElement);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [pathname, scrollOffset]);

  return null; // This component does not render anything
};

export default CarouselScroller;

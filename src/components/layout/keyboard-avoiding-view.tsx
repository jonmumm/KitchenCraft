"use client";

import React, { ReactNode, useCallback, useEffect, useRef } from "react";

interface KeyboardAvoidingViewProps {
  children: ReactNode;
}

const KeyboardAvoidingView: React.FC<KeyboardAvoidingViewProps> = ({
  children,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastKeyboardHeight = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastScrollTop = useRef(0);

  const updateViewportHeight = useCallback(() => {
    if (typeof window !== "undefined" && ref.current) {
      const keyboardHeight =
        window.innerHeight - (window.visualViewport?.height || 0);
      const shiftedForKeyboard = lastScrollTop.current === 0;

      // alert(keyboardHeight, shiftedForKeyboard);
      ref.current.style.transform = shiftedForKeyboard
        ? `translateY(-${keyboardHeight}px)`
        : `translateY(0px)`;

      // Hack to make it so bar doesnt stick out
      // todo handle this adjusgemnt elsewhere if keyboard is open
      if (
        keyboardHeight &&
        "standalone" in window.navigator &&
        window.navigator.standalone
      ) {
        ref.current.style.marginBottom = "-30px";
      } else {
        ref.current.style.marginBottom = "0px";
      }

      lastKeyboardHeight.current = keyboardHeight;

      animationFrameRef.current = requestAnimationFrame(updateViewportHeight);
    }
  }, [animationFrameRef]);

  const handleScroll = useCallback(() => {
    const currentScrollTop =
      window.pageYOffset || document.documentElement.scrollTop;
    lastScrollTop.current = currentScrollTop;
  }, [lastScrollTop]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateViewportHeight);
    window.addEventListener("scroll", handleScroll);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [updateViewportHeight, handleScroll]);

  return (
    <div className="sticky bottom-0" style={{ zIndex: 45 }}>
      <div ref={ref} className={`transition-transform pointer-events-none`}>
        {children}
      </div>
    </div>
  );
};

export default KeyboardAvoidingView;

"use client";

import { useEffect, useRef, useState } from "react";
import "./animated-text.css"; // Assuming you have a CSS file for custom styles

type AnimatedTextProps = {
  text: string;
  baseSpeed: number;
  punctDelay: number;
  delay: number;
};

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  baseSpeed,
  punctDelay,
  delay,
}) => {
  const [spans, setSpans] = useState<JSX.Element[]>([]);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const spanElements = text.split(/(\s+)/).map((word, index) => (
      <span
        key={index}
        ref={(el) => (spanRefs.current[index] = el)}
        className="text-word text-black"
      >
        {word}
      </span>
    ));
    setSpans(spanElements);
  }, [text]);

  useEffect(() => {
    let currentIndex = 0;

    const highlightWord = () => {
      if (currentIndex < spanRefs.current.length) {
        const span = spanRefs.current[currentIndex];
        if (span) {
          span.classList.add("highlight");

          const isPunctuation = [".", "?", ","].some((p) =>
            span.innerHTML.includes(p)
          );
          const currentDelay = isPunctuation ? punctDelay : baseSpeed;

          currentIndex++;
          setTimeout(highlightWord, currentDelay);
        }
      }
    };

    const startAnimation = () => {
      setTimeout(highlightWord, delay);
    };

    startAnimation();
  }, [baseSpeed, punctDelay, delay, spans]);

  return <span className="text-black">{spans.length ? <>{spans}</> : <>{text}</>}</span>;
};

export default AnimatedText;

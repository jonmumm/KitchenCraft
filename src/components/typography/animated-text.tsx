"use client";

import { useEffect, useState } from "react";
import "./animated-text.css";  // Assuming you have a CSS file for custom styles

type AnimatedTextProps = {
  text: string;
  baseSpeed: number;
  punctDelay: number;
  delay: number;
};

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, baseSpeed, punctDelay, delay }) => {
  const [spans, setSpans] = useState<JSX.Element[]>([]);
  
  useEffect(() => {
    const spanElements = text.split(/(\s+)/).map((word, index) => (
      <span key={index} className="text-word">
        {word}
      </span>
    ));
    setSpans(spanElements);
  }, [text]);

  useEffect(() => {
    const spanElements = document.querySelectorAll('.text-word');
    let currentIndex = 0;

    const highlightWord = () => {
      if (currentIndex < spanElements.length) {
        const span = spanElements[currentIndex] as HTMLElement;
        span.classList.add('highlight');

        const isPunctuation = ['.', '?', ','].some(p => span.innerHTML.includes(p));
        const currentDelay = isPunctuation ? punctDelay : baseSpeed;
        
        currentIndex++;
        setTimeout(highlightWord, currentDelay);
      }
    };

    const startAnimation = () => {
      setTimeout(highlightWord, delay);
    };

    startAnimation();

  }, [baseSpeed, punctDelay, delay, spans]);

  return <span>{spans}</span>;
};

export default AnimatedText;

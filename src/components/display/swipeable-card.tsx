import { useDrag } from "@use-gesture/react";
import React, { ReactNode } from "react";
import { animated, to, useSpring } from "react-spring";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipe: (direction: number) => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onSwipe }) => {
  const [{ x, scale }, set] = useSpring(() => ({ x: 0, scale: 1 }), []);

  const bind = useDrag(
    ({ down, movement: [mx], direction: [xDir], velocity }) => {
      const trigger = Math.abs(velocity[0]) > 0.2; // Correctly compare the x-direction velocity
      const dir = xDir < 0 ? -1 : 1; // Swipe direction
      if (!down && trigger) {
        onSwipe(dir); // Execute swipe callback
      }
      set({
        x: down ? mx : 0,
        scale: down ? 1.1 : 1,
        immediate: down,
      });
    }
  );

  return (
    <animated.div
      {...bind()}
      style={{
        touchAction: "none",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        userSelect: "none",
        // Use the 'to' function for combining multiple animated values
        transform: to(
          [x, scale],
          (x, s) => `translate3d(${x}px,0,0) scale(${s})`
        ),
      }}
    >
      {children}
    </animated.div>
  );
};

export default SwipeableCard;

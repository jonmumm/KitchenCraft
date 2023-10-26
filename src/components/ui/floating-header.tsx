"use client";

import PropTypes from "prop-types";
import { ReactNode, useEffect, useState } from "react";
import "tailwindcss/tailwind.css"; // Ensure Tailwind CSS is imported

const FloatingHeader = ({
  children,
  triggerOffset = 60,
}: {
  children: ReactNode;
  triggerOffset?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > triggerOffset) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [setIsVisible]);

  return (
    <div
      className={`fixed top-0 left-0 w-full p-2 shadow-md transition-all duration-500 ease-in-out transform bg-primary-foreground ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );
};

FloatingHeader.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FloatingHeader;

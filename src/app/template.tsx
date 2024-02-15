"use client";
import { motion } from "framer-motion";

const variants = {
  hidden: { opacity: 1, x: 0, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
};

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      variants={variants}
      initial="hidden"
      animate="enter"
      transition={{ type: "linear" }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.main>
  );
}

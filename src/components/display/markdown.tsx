"use client";

import { cn } from "@/lib/utils";
import { marked } from "marked";
import React, { useEffect, useState } from "react";
import styles from "./markdown.module.css";

interface MarkdownRendererProps {
  markdownText: string;
  variant?: "single_line" | "multi_line";
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  markdownText,
  variant = "multi_line",
  className,
}) => {
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    const renderMarkdown = async () => {
      if (variant === "multi_line") {
        const rawHtml = await marked.parse(markdownText);
        setHtmlContent(rawHtml);
      } else {
        const rawHtml = await marked.parseInline(markdownText);
        setHtmlContent(rawHtml);
      }
    };

    renderMarkdown();
  }, [markdownText, variant]);

  // const variantClass = variant === "single_line" ? styles.singleLine : "";

  return (
    <div
      className={cn([styles.markdown, className])}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;

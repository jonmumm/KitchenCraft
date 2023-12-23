import { marked } from "marked";
import React, { useEffect, useState } from "react";
import styles from "./markdown.module.css";

interface MarkdownRendererProps {
  markdownText: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  markdownText,
}) => {
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    const renderMarkdown = async () => {
      const rawHtml = await marked.parse(markdownText);
      setHtmlContent(rawHtml);
    };

    renderMarkdown();
  }, [markdownText]);
  console.log(htmlContent);

  return (
    <div
      className={styles.markdown}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;

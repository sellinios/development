'use client';
import React, { useEffect, useRef } from 'react';

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // This function properly decodes HTML entities that might be in the content
  const decodeHtmlEntities = (html: string) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = html;
    return textArea.value;
  };

  useEffect(() => {
    if (contentRef.current) {
      // Add appropriate classes to images for better styling
      const images = contentRef.current.querySelectorAll('img');
      images.forEach(img => {
        img.classList.add('rounded-xl', 'my-6', 'shadow-md');
      });

      // Enhance links
      const links = contentRef.current.querySelectorAll('a');
      links.forEach(link => {
        link.classList.add('text-blue-600', 'hover:text-blue-800', 'transition-colors', 'duration-300');
      });

      // Enhance paragraphs with better spacing and styling
      const paragraphs = contentRef.current.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.classList.add('mb-6', 'leading-relaxed', 'text-gray-800');

        // Ensure empty paragraphs still maintain spacing
        if (p.innerHTML.trim() === '' || p.innerHTML.trim() === '&nbsp;') {
          p.classList.add('h-4'); // Add height to empty paragraphs
        }
      });

      // Enhance headings
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        heading.classList.add('font-bold', 'text-blue-900', 'mt-8', 'mb-4');
      });

      // Enhance strong/bold text
      const strongElements = contentRef.current.querySelectorAll('strong, b');
      strongElements.forEach(el => {
        el.classList.add('font-semibold', 'text-black');
      });
    }
  }, [content]);

  // Process content to ensure proper spacing
  const processedContent = content
    // Ensure paragraph tags don't collapse
    .replace(/<\/p>\s*<p>/g, '</p>\n\n<p>')
    // Replace any encoded HTML entities
    .replace(/\\u003C/g, '<')
    .replace(/\\u003E/g, '>')
    .replace(/\\r\\n/g, '\n');

  return (
    <div
      ref={contentRef}
      className="article-content prose prose-lg max-w-none
                prose-headings:text-blue-900 prose-headings:font-bold
                prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-6
                prose-strong:text-black prose-strong:font-semibold
                prose-img:mx-auto prose-img:my-8
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800
                space-y-6"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
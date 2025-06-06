import React, { ReactNode } from 'react';

interface PageTemplateProps {
  children?: ReactNode;
  heroSection: ReactNode;
  content: ReactNode;
}

/**
 * PageTemplate - A standardized layout component that preserves the original content
 * while providing consistent structure
 */
const PageTemplate: React.FC<PageTemplateProps> = ({
  heroSection,
  content,
  children
}) => {
  return (
    <div className="page-content">
      {/* Hero Section from the service folder */}
      {heroSection}

      {/* Adding space between hero section and content */}
      <div className="mt-8 md:mt-16">
        {/* Main content - preserving all original text and structure */}
        {content}
      </div>

      {/* Any additional children */}
      {children}
    </div>
  );
};

export default PageTemplate;
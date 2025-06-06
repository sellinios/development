import React from 'react';
import { TEMPLATE_STYLES, combineClasses } from '../../constants/templateStyles';

interface PageTemplateProps {
  children: React.ReactNode;
  variant?: 'default' | 'tight';
  maxWidth?: 'normal' | 'wide' | 'full';
  className?: string;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  children,
  variant = 'default',
  maxWidth = 'normal',
  className,
}) => {
  const containerClass = variant === 'tight' 
    ? TEMPLATE_STYLES.containers.pageWithTightPadding 
    : TEMPLATE_STYLES.containers.pageWithPadding;

  const maxWidthClass = maxWidth === 'wide' 
    ? TEMPLATE_STYLES.containers.maxWidthWide
    : maxWidth === 'normal'
    ? TEMPLATE_STYLES.containers.maxWidthNormal
    : '';

  return (
    <div className={combineClasses(containerClass, className)}>
      <div className={TEMPLATE_STYLES.containers.contentWrapper}>
        <div className={maxWidthClass}>
          {children}
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { TEMPLATE_STYLES, combineClasses } from '../../constants/templateStyles';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
}) => {
  return (
    <div className={combineClasses(TEMPLATE_STYLES.headers.container, className)}>
      {actions ? (
        <div className={TEMPLATE_STYLES.headers.flexContainer}>
          <div className={TEMPLATE_STYLES.headers.titleSection}>
            <h1 className={TEMPLATE_STYLES.typography.pageTitle}>{title}</h1>
            {subtitle && (
              <p className={TEMPLATE_STYLES.typography.pageSubtitle}>{subtitle}</p>
            )}
          </div>
          <div className="flex gap-2">
            {actions}
          </div>
        </div>
      ) : (
        <>
          <h1 className={TEMPLATE_STYLES.typography.pageTitle}>{title}</h1>
          {subtitle && (
            <p className={TEMPLATE_STYLES.typography.pageSubtitle}>{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
};
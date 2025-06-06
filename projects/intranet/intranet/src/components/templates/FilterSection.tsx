import React from 'react';
import { TEMPLATE_STYLES, combineClasses } from '../../constants/templateStyles';

interface FilterSectionProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  children,
  columns = 4,
  className,
}) => {
  const gridClass = columns === 1 ? 'grid grid-cols-1 gap-4'
    : columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
    : columns === 3 ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
    : TEMPLATE_STYLES.filters.grid;

  return (
    <div className={combineClasses(TEMPLATE_STYLES.filters.container, className)}>
      <div className={gridClass}>
        {children}
      </div>
    </div>
  );
};
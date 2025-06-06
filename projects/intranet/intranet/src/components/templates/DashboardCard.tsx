import React from 'react';
import { TEMPLATE_STYLES, combineClasses } from '../../constants/templateStyles';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  bgColor?: string;
  hoverColor?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  icon,
  bgColor = 'bg-white',
  hoverColor = 'hover:bg-gray-50',
  onClick,
  className,
  children,
}) => {
  const cardClass = bgColor !== 'bg-white' || hoverColor !== 'hover:bg-gray-50'
    ? TEMPLATE_STYLES.cards.colored(bgColor, hoverColor)
    : onClick
    ? TEMPLATE_STYLES.cards.interactive
    : TEMPLATE_STYLES.cards.withPadding;

  return (
    <div
      className={combineClasses(cardClass, className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start">
        {icon && (
          <div className={combineClasses(TEMPLATE_STYLES.icons.dashboard, 'mr-4 flex-shrink-0')}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className={TEMPLATE_STYLES.typography.sectionTitle}>{title}</h3>
          {subtitle && (
            <p className={TEMPLATE_STYLES.typography.sectionSubtitle}>{subtitle}</p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
};
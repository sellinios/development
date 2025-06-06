import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Laptop, Car, Building, Wrench, BarChart3 } from 'lucide-react';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

const Assets: React.FC = () => {
  const navigate = useNavigate();

  const assetModules = [
    {
      title: 'IT Equipment',
      description: 'Computers, servers, and network equipment',
      icon: Laptop,
      path: '/assets/it-equipment',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
    {
      title: 'Vehicles',
      description: 'Company vehicles and transportation assets',
      icon: Car,
      path: '/assets/vehicles',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
    {
      title: 'Facilities',
      description: 'Buildings, offices, and property management',
      icon: Building,
      path: '/assets/facilities',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    },
    {
      title: 'Equipment',
      description: 'Tools, machinery, and operational equipment',
      icon: Wrench,
      path: '/assets/equipment',
      bgColor: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
    },
    {
      title: 'Inventory',
      description: 'Track supplies and consumable resources',
      icon: Package,
      path: '/assets/inventory',
      bgColor: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
    },
    {
      title: 'Reports',
      description: 'Asset utilization and depreciation reports',
      icon: BarChart3,
      path: '/assets/reports',
      bgColor: 'bg-teal-600',
      hoverColor: 'hover:bg-teal-700',
    },
  ];

  return (
    <PageTemplate maxWidth="wide">
      <PageHeader 
        title="Asset Management"
        subtitle="Track and manage company assets and resources"
      />

      <div className={TEMPLATE_STYLES.grids.threeColumn}>
        {assetModules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.title}
              onClick={() => navigate(module.path)}
              className={TEMPLATE_STYLES.cards.colored(module.bgColor, module.hoverColor)}
            >
              <div className="flex flex-col h-full">
                <Icon className={`${TEMPLATE_STYLES.icons.dashboard} text-white mb-3 sm:mb-4`} />
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1 sm:mb-2">
                  {module.title}
                </h2>
                <p className="text-sm sm:text-base text-white/90 flex-grow">
                  {module.description}
                </p>
                <div className="text-white/50 mt-4 self-end">
                  <svg
                    className={TEMPLATE_STYLES.icons.xlarge}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageTemplate>
  );
};

export default Assets;
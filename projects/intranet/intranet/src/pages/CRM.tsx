import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Anchor, Users, UserCheck, Briefcase, TrendingUp, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

const CRM: React.FC = () => {
  const navigate = useNavigate();

  const crmModules = [
    {
      title: 'Accounts',
      description: 'Manage customer accounts and company information',
      icon: Building2,
      path: '/crm/accounts',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
    {
      title: 'Ships',
      description: 'Vessel information and fleet management',
      icon: Anchor,
      path: '/crm/ships',
      bgColor: 'bg-cyan-600',
      hoverColor: 'hover:bg-cyan-700',
    },
    {
      title: 'Crews',
      description: 'Crew member management and assignments',
      icon: Users,
      path: '/crm/crews',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
    {
      title: 'Contacts',
      description: 'Contact information and communication history',
      icon: UserCheck,
      path: '/crm/contacts',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    },
    {
      title: 'Manning Agents',
      description: 'Manage manning agency relationships',
      icon: Briefcase,
      path: '/crm/manning-agents',
      bgColor: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
    },
    {
      title: 'Competition',
      description: 'Track and analyze competitor activities',
      icon: TrendingUp,
      path: '/crm/competition',
      bgColor: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
    },
    {
      title: 'Sales',
      description: 'Sales pipeline and opportunity management',
      icon: DollarSign,
      path: '/crm/sales',
      bgColor: 'bg-emerald-600',
      hoverColor: 'hover:bg-emerald-700',
    },
    {
      title: 'Visits',
      description: 'Schedule and track customer visits',
      icon: Calendar,
      path: '/crm/visits',
      bgColor: 'bg-pink-600',
      hoverColor: 'hover:bg-pink-700',
    },
    {
      title: 'Communication',
      description: 'Communication logs and correspondence',
      icon: MessageSquare,
      path: '/crm/communication',
      bgColor: 'bg-teal-600',
      hoverColor: 'hover:bg-teal-700',
    },
  ];

  return (
    <PageTemplate maxWidth="wide">
      <PageHeader 
        title="CRM Management"
        subtitle="Manage your customer relationships and business operations"
      />

      <div className={TEMPLATE_STYLES.grids.threeColumn}>
        {crmModules.map((module) => {
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

export default CRM;
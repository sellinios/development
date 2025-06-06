import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Folder, Bug, Settings, Book, Phone, Lightbulb } from 'lucide-react';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

const ITSupport: React.FC = () => {
  const navigate = useNavigate();

  const supportModules = [
    {
      title: 'Help Desk',
      description: 'Submit and track support tickets for IT and R&D',
      icon: Ticket,
      path: '/support/tickets',
      bgColor: 'bg-red-600',
      hoverColor: 'hover:bg-red-700',
    },
    {
      title: 'All Projects',
      description: 'View and manage all projects across departments',
      icon: Folder,
      path: '/projects',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
    {
      title: 'Issue Tracking',
      description: 'Bug reports and issue management for all systems',
      icon: Bug,
      path: '/support/issues',
      bgColor: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
    },
    {
      title: 'R&D Innovation',
      description: 'Research and development initiatives',
      icon: Lightbulb,
      path: '/support/rnd',
      bgColor: 'bg-yellow-600',
      hoverColor: 'hover:bg-yellow-700',
    },
    {
      title: 'System Status',
      description: 'Monitor system health and infrastructure',
      icon: Settings,
      path: '/support/status',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
    {
      title: 'Knowledge Base',
      description: 'Technical documentation and guides',
      icon: Book,
      path: '/support/knowledge',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    },
    {
      title: 'Contact Support',
      description: 'Direct contact with IT and R&D teams',
      icon: Phone,
      path: '/support/contact',
      bgColor: 'bg-pink-600',
      hoverColor: 'hover:bg-pink-700',
    },
  ];

  return (
    <PageTemplate maxWidth="wide">
      <PageHeader 
        title="Support & R&D Center"
        subtitle="Technical support, project management, and research & development"
      />

      <div className={TEMPLATE_STYLES.grids.threeColumn}>
        {supportModules.map((module) => {
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

export default ITSupport;
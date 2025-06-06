import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Users, Package, HeadphonesIcon, Globe } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { canViewPage, loading } = usePermissions();

  const sections = [
    {
      title: 'CRM',
      description: 'Manage customer relationships, accounts, ships, and more',
      icon: Database,
      path: '/crm',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      requiresPermission: () => canViewPage('crm'),
    },
    {
      title: 'HR Management',
      description: 'Employee management, leave tracking, and organizational structure',
      icon: Users,
      path: '/hr',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      requiresPermission: () => canViewPage('hr'),
    },
    {
      title: 'Assets',
      description: 'Track and manage company assets, equipment, and resources',
      icon: Package,
      path: '/assets',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      requiresPermission: () => canViewPage('assets'),
    },
    {
      title: 'Support & R&D',
      description: 'Technical support, R&D projects, and issue tracking',
      icon: HeadphonesIcon,
      path: '/support',
      bgColor: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      requiresPermission: () => canViewPage('support'),
    },
    {
      title: 'Website Management',
      description: 'Manage websites, content, news, and social media',
      icon: Globe,
      path: '/websites',
      bgColor: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
      requiresPermission: () => canViewPage('websites') || canViewPage('content'),
    },
  ];

  if (loading) {
    return (
      <PageTemplate>
        <div className={TEMPLATE_STYLES.states.loading}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      <PageHeader 
        title="Welcome to Epsilon Intranet"
        subtitle="Access your applications and services"
      />

      <div className={TEMPLATE_STYLES.grids.twoColumn}>
        {sections.map((section) => {
          const Icon = section.icon;
          const hasAccess = section.requiresPermission();
          
          return (
            <div
              key={section.title}
              onClick={() => hasAccess && navigate(section.path)}
              className={`
                ${TEMPLATE_STYLES.cards.colored(
                  hasAccess ? section.bgColor : 'bg-gray-300',
                  hasAccess ? section.hoverColor : ''
                )}
                ${!hasAccess && 'cursor-not-allowed opacity-60'}
              `}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex-1">
                  <Icon className={`${TEMPLATE_STYLES.icons.dashboard} text-white mb-3 sm:mb-4`} />
                  <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1 sm:mb-2">
                    {section.title}
                  </h2>
                  <p className="text-sm sm:text-base text-white/90">
                    {section.description}
                  </p>
                </div>
                <div className="text-white/50 mt-4 sm:mt-0 sm:ml-4 self-end sm:self-center">
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

export default Home;
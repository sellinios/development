import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Shield, FileKey } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission, isAdmin, loading } = usePermissions();

  const adminSections = [
    {
      title: 'Organization',
      description: 'Manage organizational structure, departments, and entities',
      icon: Building2,
      path: '/entities',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      requiresPermission: () => hasPermission('entities', 'read') || hasPermission('entities', 'view'),
    },
    {
      title: 'Users',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      path: '/users',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      requiresPermission: () => hasPermission('users', 'read') || hasPermission('users', 'view'),
    },
    {
      title: 'Roles',
      description: 'Manage roles and their permissions',
      icon: Shield,
      path: '/admin/roles',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      requiresPermission: () => hasPermission('roles', 'read') || isAdmin(),
    },
    {
      title: 'Permissions',
      description: 'Configure role permissions and page access',
      icon: FileKey,
      path: '/admin/page-access',
      bgColor: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      requiresPermission: () => hasPermission('roles', 'update') || isAdmin(),
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
        title="Admin Panel"
        subtitle="Manage your organization and users"
      />

      <div className={TEMPLATE_STYLES.grids.twoColumn}>
        {adminSections.map((section) => {
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

export default AdminPanel;
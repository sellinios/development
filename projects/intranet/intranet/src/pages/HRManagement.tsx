import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Building2, FileText, Award, Clock, UserCheck, Shield, Anchor } from 'lucide-react';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

const HRManagement: React.FC = () => {
  const navigate = useNavigate();

  const hrModules = [
    {
      title: 'Employees',
      description: 'Manage employee records and personal information',
      icon: Users,
      path: '/hr/employees',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
    {
      title: 'User Accounts',
      description: 'Manage system access and user credentials',
      icon: UserCheck,
      path: '/users',
      bgColor: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
    },
    {
      title: 'Job Applicants',
      description: 'Review and manage seafarer job applications',
      icon: Anchor,
      path: '/hr/applicants',
      bgColor: 'bg-cyan-600',
      hoverColor: 'hover:bg-cyan-700',
    },
    {
      title: 'Leave Management',
      description: 'Track and approve employee leave requests',
      icon: Calendar,
      path: '/hr/leave',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
    {
      title: 'Organization',
      description: 'Manage departments and organizational structure',
      icon: Building2,
      path: '/entities',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    },
    {
      title: 'Documents',
      description: 'Employee documents and contracts management',
      icon: FileText,
      path: '/hr/documents',
      bgColor: 'bg-yellow-600',
      hoverColor: 'hover:bg-yellow-700',
    },
    {
      title: 'Training',
      description: 'Track employee training and certifications',
      icon: Award,
      path: '/hr/training',
      bgColor: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
    },
    {
      title: 'Attendance',
      description: 'Time tracking and attendance management',
      icon: Clock,
      path: '/hr/attendance',
      bgColor: 'bg-teal-600',
      hoverColor: 'hover:bg-teal-700',
    },
  ];

  return (
    <PageTemplate maxWidth="wide">
      <PageHeader 
        title="HR Management"
        subtitle="Manage your human resources and organizational structure"
      />

      <div className={TEMPLATE_STYLES.grids.threeColumn}>
        {hrModules.map((module) => {
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

export default HRManagement;
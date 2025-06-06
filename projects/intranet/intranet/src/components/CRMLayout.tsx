import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';

const CRMLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/crm', label: 'Home', exact: true },
    { path: '/crm/accounts', label: 'Accounts' },
    { path: '/crm/ships', label: 'Ships' },
    { path: '/crm/crews', label: 'Crews' },
    { path: '/crm/contacts', label: 'Contacts' },
    { path: '/crm/manning-agents', label: 'Manning Agents' },
    { path: '/crm/competition', label: 'Competition' },
    { path: '/crm/sales', label: 'Sales' },
    { path: '/crm/visits', label: 'Visits' },
    { path: '/crm/communication', label: 'Communication' },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div>
      {/* CRM Sub-navigation */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${
                  isActive(item.path, item.exact)
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* CRM Content */}
      <Outlet />
    </div>
  );
};

export default CRMLayout;
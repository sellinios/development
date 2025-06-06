"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  Atom,
  Map,
  BarChart2,
  Newspaper,
  Mail,
  Users,
  User,
  GraduationCap,
  Search,
  Cpu,
  SettingsIcon
} from 'lucide-react';

// Define navigation items with Lucide icons
const navItems = [
  { href: "/about-us", label: "ABOUT US", icon: <Info size={16} /> },
  {
    href: "https://site.epsilonhellas.com/services",
    label: "SERVICES",
    icon: <Atom size={16} />,
    hasDropdown: true,
    dropdownItems: [
      { href: "/services/crew-management", label: "CREW MANAGEMENT", icon: <Users size={16} /> },
      { href: "/services/crew-manning", label: "CREW MANNING", icon: <User size={16} /> },
      { href: "/services/training", label: "TRAINING", icon: <GraduationCap size={16} /> },
      { href: "/services/pre-vetting-inspections", label: "PRE-VETTING INSPECTIONS", icon: <Search size={16} /> },
      { href: "/services/technical-services", label: "TECHNICAL SERVICES", icon: <Cpu size={16} /> },
      { href: "/services/", label: "ALL SERVICES", icon: <SettingsIcon size={16} /> }
    ]
  },
  { href: "/locations", label: "LOCATIONS", icon: <Map size={16} /> },
  { href: "/facts", label: "FACTS & FIGURES", icon: <BarChart2 size={16} /> },
  { href: "/news", label: "NEWS & EVENTS", icon: <Newspaper size={16} /> },
  { href: "/contact", label: "CONTACT US", icon: <Mail size={16} /> }
];

const SimpleNavigationMenu = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Toggle dropdown
  const toggleDropdown = (href: string) => {
    setActiveDropdown(activeDropdown === href ? null : href);
  };

  // Check if a path is active or its child routes
  const isActiveRoute = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <div className="p-3">
      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-center space-x-6">
        {navItems.map((item) => (
          <div key={item.href} className="relative">
            {item.hasDropdown ? (
              <>
                <button
                  onClick={() => toggleDropdown(item.href)}
                  className="flex items-center text-sm font-bold text-[#003070] hover:text-blue-600"
                  aria-expanded={activeDropdown === item.href}
                >
                  <span className="mr-1.5 flex items-center">{item.icon}</span>
                  {item.label}
                  {activeDropdown === item.href ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>

                {/* Dropdown menu */}
                {activeDropdown === item.href && (
                  <div className="absolute left-0 mt-2 w-60 bg-white rounded-md shadow-lg overflow-hidden z-20">
                    <div className="py-1 border-t border-gray-100">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className="flex items-center px-4 py-3 text-sm hover:bg-blue-50 transition-colors text-[#003070]"
                        >
                          <span className="mr-3">{dropdownItem.icon}</span>
                          {dropdownItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className="flex items-center text-sm font-bold text-[#003070] hover:text-blue-600"
              >
                <span className="mr-1.5 flex items-center">{item.icon}</span>
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#003070] p-2 hover:text-blue-600"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white z-10 py-2 border-t border-gray-100">
            {navItems.map((item) => (
              <div key={item.href} className="px-4">
                {item.hasDropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.href)}
                      className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#003070] hover:text-blue-600"
                    >
                      <span className="flex items-center">
                        <span className="mr-2 flex items-center">{item.icon}</span>
                        {item.label}
                      </span>
                      {activeDropdown === item.href ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {activeDropdown === item.href && (
                      <div className="pl-6 py-2 space-y-2 border-l border-gray-200 ml-2">
                        {item.dropdownItems?.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.href}
                            href={dropdownItem.href}
                            className="flex items-center py-1 text-sm text-[#003070] hover:text-blue-600"
                          >
                            <span className="mr-2 flex items-center">{dropdownItem.icon}</span>
                            {dropdownItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center py-2 text-sm font-bold text-[#003070] hover:text-blue-600"
                  >
                    <span className="mr-2 flex items-center">{item.icon}</span>
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleNavigationMenu;
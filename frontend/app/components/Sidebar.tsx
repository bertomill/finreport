"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Icons for the sidebar
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

// Navigation sections
const navigation = {
  overview: [
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { name: 'Upload', href: '/dashboard/upload', icon: UploadIcon },
  ]
};

export default function Sidebar({ user }: { user: { email: string } }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-xl font-bold text-gray-900">Financial Reporter</span>
            </div>
            <div className="flex-1 flex flex-col mt-8">
              {/* User info */}
              <div className="px-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl font-semibold text-gray-600">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 text-sm font-medium text-gray-700 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              
              {/* Main Navigation */}
              <nav className="px-3 mt-3 space-y-1">
                {navigation.overview.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <div className={`
                      mr-3 flex-shrink-0
                      ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `}>
                      <item.icon />
                    </div>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
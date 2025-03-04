// src/components/layout/sidebar.tsx
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Package,
  Calendar,
  Settings,
  AlertTriangle,
  Users,
  FileText,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  // Cast AuthContext to any to avoid TypeScript errors
  const { user } = useContext(AuthContext as any);
  
  // Function to close sidebar on mobile
  const closeSidebar = () => {
    // This would be passed from the parent in a real implementation
    // but we're just providing a no-op for now
    console.log('Sidebar closed');
  };

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['admin', 'manager', 'technician'] },
    { name: 'Vehicles', icon: Truck, href: '/vehicles', roles: ['admin', 'manager', 'technician'] },
    { name: 'Work Orders', icon: Wrench, href: '/work-orders', roles: ['admin', 'manager', 'technician'] },
    { name: 'Parts Inventory', icon: Package, href: '/parts', roles: ['admin', 'manager', 'technician'] },
    { name: 'Maintenance', icon: Calendar, href: '/maintenance', roles: ['admin', 'manager', 'technician'] },
    { name: 'Samsara', icon: AlertTriangle, href: '/samsara', roles: ['admin', 'manager'] },
    { name: 'Reports', icon: FileText, href: '/reports', roles: ['admin', 'manager'] },
    { name: 'Alerts', icon: AlertTriangle, href: '/alerts', roles: ['admin', 'manager', 'technician'] },
    { name: 'Users', icon: Users, href: '/users', roles: ['admin'] },
    { name: 'Settings', icon: Settings, href: '/settings', roles: ['admin'] },
  ];

  // Filter navigation items based on user role
  const filteredNav = navigation.filter(item => {
    // If user role is not yet loaded, show all items
    if (!user?.role) return true;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <img
              className="h-8 w-auto"
              src="/logo.svg"
              alt="Fleet DMS"
            />
            <h1 className="ml-2 text-xl font-bold">Fleet DMS</h1>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => 
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-500'
                    }`} 
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Fleet DMS v1.0
          </div>
          <div className="mt-1 text-xs text-gray-500">
            © 2025 Fleet DMS
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FilePlus,
  Users,
  UserCheck,
  ShoppingBag,
  Home,
  Truck,
  Boxes,
  FileSpreadsheet,
  Settings,
  Search,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard }
      ]
    },
    {
      title: 'SALES & BILLING',
      items: [
        { name: 'New Bill (POS)', path: '/sales/new', icon: FilePlus },
        { name: 'Sales History', path: '/sales', icon: Receipt },
        { name: 'Customer Dues', path: '/customers/dues', icon: UserCheck },
        { name: 'Customers', path: '/customers', icon: Users }
      ]
    },
    {
      title: 'PURCHASES',
      items: [
        { name: 'Shop Purchases', path: '/purchases/shop', icon: ShoppingBag },
        { name: 'Home Purchases', path: '/purchases/home', icon: Home },
        { name: 'Supplier Dues', path: '/suppliers/dues', icon: Truck },
        { name: 'Suppliers', path: '/suppliers', icon: Users }
      ]
    },
    {
      title: 'BUSINESS & REPORTS',
      items: [
        { name: 'Inventory Stock', path: '/inventory', icon: Boxes },
        { name: 'Reports & Analytics', path: '/reports', icon: FileSpreadsheet },
        { name: 'Global Search', path: '/search', icon: Search },
        { name: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 z-30 border-r-2 border-slate-700 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b-2 border-slate-700 flex items-center gap-3 bg-slate-950">
        <div className="w-9 h-9 rounded bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">
          🥥
        </div>
        <div className="overflow-hidden">
          <h1 className="font-heading font-extrabold text-base text-white leading-tight uppercase tracking-tight truncate">
            POOJA COCONUTS
          </h1>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            WHOLESALE & RETAIL ERP
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
              {group.title}
            </h2>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded text-xs font-bold transition ${
                      isActive
                        ? 'bg-emerald-600 text-white font-extrabold border-l-4 border-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / User Profile */}
      <div className="p-3 border-t-2 border-slate-700 bg-slate-950 space-y-2">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs border border-slate-700">
              {user?.name ? user.name[0] : 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Shop Owner'}</p>
              <p className="text-[10px] text-slate-400 font-mono">Role: {user?.role || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-bold text-rose-400 hover:bg-rose-950/60 transition border border-rose-900/50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

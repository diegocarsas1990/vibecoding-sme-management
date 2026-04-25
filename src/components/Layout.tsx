import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Filter, Users, CheckSquare, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/sales-funnel', icon: Filter, label: 'Funnel' },
  { path: '/crm', icon: Users, label: 'CRM' },
  { path: '/execution', icon: CheckSquare, label: 'Execution' },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-800/50 border-r border-slate-700/50 backdrop-blur-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            SME Manager
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            SME Manager
          </h1>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-lg border-t border-slate-700/50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

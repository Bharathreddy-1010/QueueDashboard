import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  BarChart3,
  Settings,
  LogOut,
  Users,
  Activity,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Queues', path: '/queues', icon: Layers },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#050606] border-r border-[#1D2222] flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Close Button (mobile) */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-[#1D2222]">
            <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#C8FF00] flex items-center justify-center text-[#050606] font-extrabold text-lg shadow-accent group-hover:scale-105 transition-transform">
                Q
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#F5F3EF]">
                  Queue<span className="text-[#C8FF00]">Pro</span>
                </span>
                <span className="block text-[10px] uppercase font-semibold tracking-widest text-[#8E9393]">
                  Management System
                </span>
              </div>
            </NavLink>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#8E9393] hover:text-[#F5F3EF] lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6">
            <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#656B6B]">
              Main Menu
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-[#C8FF00] text-[#050606] shadow-accent'
                          : 'text-[#8E9393] hover:text-[#F5F3EF] hover:bg-[#131616]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#050606]' : 'text-[#8E9393]'}`} />
                        <span>{item.name}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#050606]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Connection status & User Profile */}
        <div className="p-4 border-t border-[#1D2222] bg-[#0A0C0C]/50 space-y-3">
          {/* Real-time sync status pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#131616] border border-[#222727]">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-[#C8FF00] animate-pulse-subtle' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-medium text-[#8E9393]">
                {isConnected ? 'Real-time Connected' : 'Connecting...'}
              </span>
            </div>
            <Activity className={`w-3.5 h-3.5 ${isConnected ? 'text-[#C8FF00]' : 'text-amber-500'}`} />
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#131616] transition-colors">
            <NavLink
              to="/profile"
              onClick={() => onClose && onClose()}
              className="flex items-center gap-3 overflow-hidden flex-1 min-w-0"
            >
              <div className="w-9 h-9 rounded-full bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00] font-bold text-sm flex-shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </div>
              <div className="overflow-hidden truncate">
                <p className="text-sm font-semibold text-[#F5F3EF] truncate">{user?.name || 'Manager'}</p>
                <p className="text-xs text-[#8E9393] truncate">{user?.email || 'manager@queuepro.com'}</p>
              </div>
            </NavLink>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-[#8E9393] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

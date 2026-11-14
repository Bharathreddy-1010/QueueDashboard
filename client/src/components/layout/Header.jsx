import React, { useState } from 'react';
import { Menu, Bell, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const Header = ({ title, subtitle, onMenuClick, rightAction }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    {
      id: 1,
      title: 'High queue volume',
      desc: 'General Customer Service exceeded 5 waiting customers.',
      time: '10m ago',
      type: 'warning',
    },
    {
      id: 2,
      title: 'Shift target achieved',
      desc: 'Over 20 customers served successfully today.',
      time: '1h ago',
      type: 'success',
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-20 bg-[#050606]/40 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-[#8E9393] hover:text-[#F5F3EF] hover:bg-[#131616] rounded-xl lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F3EF]">{title}</h1>
          {subtitle && <p className="text-xs text-[#8E9393] hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {rightAction}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-[#131616] border border-[#272D2D] text-[#8E9393] hover:text-[#F5F3EF] hover:border-[#3B4242] transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C8FF00]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#131616] border border-[#272D2D] rounded-2xl p-4 shadow-xl z-50">
              <div className="flex items-center justify-between pb-3 border-b border-[#222727]">
                <h4 className="text-sm font-semibold text-[#F5F3EF]">Notifications</h4>
                <span className="text-[11px] text-[#C8FF00] font-mono">2 unread</span>
              </div>
              <div className="mt-3 space-y-2">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-[#0D0F0F] border border-[#222727] text-xs">
                    <div className="flex items-center gap-2 font-medium text-[#F5F3EF]">
                      {n.type === 'warning' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C8FF00]" />
                      )}
                      <span>{n.title}</span>
                      <span className="ml-auto text-[10px] text-[#8E9393]">{n.time}</span>
                    </div>
                    <p className="text-[#8E9393] mt-1 pl-5.5">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <Link
          to="/profile"
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-[#131616] border border-[#272D2D] hover:border-[#3B4242] transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-[#C8FF00] text-[#050606] font-bold text-xs flex items-center justify-center">
            {user?.name ? user.name[0].toUpperCase() : 'M'}
          </div>
          <span className="text-xs font-semibold text-[#F5F3EF] hidden sm:inline-block">
            {user?.name || 'Manager'}
          </span>
        </Link>
      </div>
    </header>
  );
};

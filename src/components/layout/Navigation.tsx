import React from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Megaphone,
  Briefcase,
  ShieldCheck,
  User,
  Settings,
  Building2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';

interface NavigationProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onOpenAuth }) => {
  const { activeTab, setActiveTab, chats, currentUser, permissions } = useAlumni();

  // Compute total unread messages for current user
  const totalUnreadMessages = React.useMemo(() => {
    if (!currentUser) return 0;
    return chats.reduce((acc, chat) => {
      return acc + (chat.unreadCount[currentUser.uid] || 0);
    }, 0);
  }, [chats, currentUser]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(currentUser?.role === 'employer'
      ? [{ id: 'employer_portal', label: 'Employer Dashboard', icon: Building2 }]
      : []),
    { id: 'network', label: 'Friends & Network', icon: Users },
    {
      id: 'messages',
      label: 'Messaging',
      icon: MessageSquare,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : null
    },
    { id: 'events', label: 'Events & Reunions', icon: Calendar },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'opportunities', label: 'Job Board', icon: Briefcase },
    ...(permissions.canAccessAdminPanel
      ? [{ id: 'admin', label: 'Admin Panel', icon: ShieldCheck }]
      : []),
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="bg-white border-b border-stone-200 shadow-xs sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 py-2 sm:py-2.5">
          {/* Main Navigation Tabs */}
          <div className="flex space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none items-center flex-1 min-w-0 pr-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#991B1B] text-white shadow-sm shadow-red-900/20 font-extrabold ring-1 ring-[#991B1B]'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-[#991B1B]' : 'bg-red-600 text-white shadow-xs'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

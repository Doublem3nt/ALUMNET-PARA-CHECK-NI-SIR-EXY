import React, { useState } from 'react';
import {
  Bell,
  Search,
  UserCheck,
  Check,
  X,
  Shield,
  GraduationCap,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
  ExternalLink,
  Image as ImageIcon,
  LogIn,
  UserPlus,
  ArrowRightLeft,
  CreditCard
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserRole } from '../../types';
import { CampusGalleryModal } from '../gallery/CampusGalleryModal';
import { DigitalAlumniCard } from '../profile/DigitalAlumniCard';

export const Header: React.FC<{
  onOpenSearch?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onGoToLanding?: () => void;
}> = ({ onOpenAuth, onGoToLanding }) => {
  const {
    currentUser,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    isConnected,
    getConnectionStatus,
    setActiveTab,
    logout,
    switchUser,
    setSelectedUserIdForModal
  } = useAlumni();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showDigitalCardModal, setShowDigitalCardModal] = useState(false);

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'registrar':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'moderator':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  const userNotifications = notifications.filter(
    (n) => n.toUid === currentUser?.uid
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#8B181B] to-amber-500 shadow-sm flex items-center justify-center shrink-0">
              <img
                src="/assets/cecilians-seal.jpg"
                alt="Alumni Cecilian's Seal"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">St. Cecilia's College</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-red-50 text-[#8B181B] border border-red-200">
                  Alumni Portal
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">Official Alumni & Institutional Network</p>
            </div>
          </div>

          {/* Center search trigger */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setActiveTab('network')}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-stone-400 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors text-left"
            >
              <Search className="w-4 h-4 text-stone-400" />
              <span>Search alumni by name, course, batch, or company...</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* View Landing Page (Only when not logged in) */}
            {onGoToLanding && !currentUser && (
              <button
                onClick={onGoToLanding}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors"
                title="View Public Landing Page"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Landing Page</span>
              </button>
            )}

            {/* Campus & Heritage Gallery trigger (Only when not logged in) */}
            {!currentUser && (
              <button
                onClick={() => setShowGalleryModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors"
                title="View Campus & Heritage Gallery"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Campus Gallery</span>
              </button>
            )}

            {/* Digital ID Pass Button - Always visible and active */}
            <button
              type="button"
              id="header-digital-id-button"
              onClick={() => setShowDigitalCardModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
              title="View St. Cecilia's College Digital ID Pass & Campus Gate Pass"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden min-[380px]:inline">Digital ID</span>
              <span className="min-[380px]:hidden">ID</span>
            </button>

            {/* Sign In & Register when not logged in */}
            {!currentUser && onOpenAuth && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-stone-700 hover:text-[#991B1B] hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#991B1B] hover:bg-[#7f1616] text-white shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Verified Role Badge */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 text-stone-800 border border-stone-200">
                <Shield className="w-3.5 h-3.5 text-[#991B1B]" />
                <span className="capitalize font-bold text-[#991B1B]">{currentUser.role}</span>
              </div>
            )}

            {/* Notifications Bell with Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 font-medium rounded-full">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center text-stone-400 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      userNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3.5 transition-colors ${
                            !n.read ? 'bg-blue-50/60' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs font-semibold text-stone-900">{n.title}</div>
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {new Date(n.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.body}</p>

                          {/* Inline Accept/Decline for Friend Requests */}
                          {n.type === 'friend_request' && (
                            <div className="mt-2.5">
                              {n.actionStatus === 'accepted' || isConnected(n.fromUid || '') || getConnectionStatus(n.fromUid || '') === 'accepted' ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-md border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Connection Accepted</span>
                                </div>
                              ) : n.actionStatus === 'declined' || getConnectionStatus(n.fromUid || '') === 'declined' ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-500 bg-stone-100 rounded-md">
                                  <span>Request declined</span>
                                </div>
                              ) : n.refId ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      acceptFriendRequest(n.refId!);
                                      markNotificationAsRead(n.id);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#991B1B] hover:bg-[#7f1616] rounded-md shadow-xs transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      declineFriendRequest(n.refId!);
                                      markNotificationAsRead(n.id);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-200 hover:bg-stone-300 rounded-md transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Avatar & Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-400 transition-all"
                >
                  <img
                    src={currentUser.profilePictureUrl}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-stone-200"
                  />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900">{currentUser.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded uppercase font-semibold border ${getRoleBadgeColor(
                          currentUser.role
                        )}`}
                      >
                        {currentUser.role}
                      </span>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-700 hover:bg-stone-100 rounded-lg"
                      >
                        <UserIcon className="w-4 h-4 text-stone-500" />
                        <span>View Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowDigitalCardModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-900 bg-amber-50/70 hover:bg-amber-100/80 rounded-lg font-medium"
                      >
                        <CreditCard className="w-4 h-4 text-amber-700" />
                        <span>Digital Alumni Pass</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-700 hover:bg-stone-100 rounded-lg"
                      >
                        <SettingsIcon className="w-4 h-4 text-stone-500" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg border-t border-stone-100 mt-1 pt-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CampusGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
      />

      {/* Digital Alumni Card (Banking Card Pass) Modal */}
      {showDigitalCardModal && (
        <div
          id="digital-id-modal-overlay"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-2 sm:p-5 animate-in fade-in"
          onClick={() => setShowDigitalCardModal(false)}
        >
          <div
            id="digital-id-modal-container"
            className="relative my-auto bg-stone-900 border border-stone-700/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 max-w-lg w-full text-white shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    St. Cecilia's College Digital Pass
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Official NFC & turnstile campus identification credential
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDigitalCardModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-1">
              <DigitalAlumniCard
                user={
                  currentUser || {
                    uid: 'preview_scc',
                    name: "St. Cecilia's Graduate",
                    email: 'alumni@stcecilia.edu',
                    role: 'alumni',
                    batch: '2024',
                    course: 'B.S. Information Technology',
                    studentId: 'SCC-2024-0001',
                    location: 'Cebu, Philippines',
                    isVerified: true,
                    createdAt: new Date().toISOString()
                  }
                }
              />
            </div>

            {currentUser ? (
              <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>
                  Card Status:{' '}
                  <strong className="text-emerald-400 font-semibold">Active & Verified</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowDigitalCardModal(false);
                    setActiveTab('profile');
                    setTimeout(() => {
                      const el = document.getElementById('digital-id-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  Manage in Profile →
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-stone-400 text-center sm:text-left">
                  Sign in or register to claim your personal SCC Digital Pass.
                </span>
                <div className="flex items-center gap-2">
                  {onOpenAuth && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDigitalCardModal(false);
                          onOpenAuth('login');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors cursor-pointer"
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDigitalCardModal(false);
                          onOpenAuth('register');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#991B1B] hover:bg-[#7f1616] text-white font-bold transition-colors cursor-pointer"
                      >
                        Register ID
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

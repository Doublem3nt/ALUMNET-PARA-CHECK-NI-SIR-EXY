/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlumniProvider, useAlumni, STORAGE_KEYS } from './context/AlumniContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { NetworkView } from './components/network/NetworkView';
import { MessagesView } from './components/messages/MessagesView';
import { EventsView } from './components/events/EventsView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { OpportunitiesView } from './components/opportunities/OpportunitiesView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminPanelView } from './components/admin/AdminPanelView';
import { EmployerDashboardView } from './components/opportunities/EmployerDashboardView';
import { PublicProfileModal } from './components/profile/PublicProfileModal';
import { FirstTimeProfileSetupModal } from './components/profile/FirstTimeProfileSetupModal';
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './components/landing/LandingPage';
import { ToastContainer } from './components/common/ToastContainer';
import { VerificationGate } from './components/common/VerificationGate';
import { GraduationCap, LogIn, UserPlus, Globe } from 'lucide-react';

function AppContent() {
  const { activeTab, setActiveTab, currentUser, authReady } = useAlumni();
  const [currentView, setCurrentView] = useState<'landing' | 'portal' | 'auth'>(() => {
    try {
      const savedSession =
        localStorage.getItem(STORAGE_KEYS.USER_ID) ||
        localStorage.getItem('alumni_auth_session_real_v1');
      const savedView = localStorage.getItem(STORAGE_KEYS.VIEW);
      if (savedSession) {
        return savedView === 'landing' ? 'landing' : 'portal';
      }
      return savedView === 'landing' ? 'landing' : 'auth';
    } catch {
      return 'auth';
    }
  });
  const [authViewMode, setAuthViewMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'alumni' | 'employer'>('alumni');
  const [showProfileSetupModal, setShowProfileSetupModal] = useState(false);

  // Sync currentView changes to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, currentView);
    } catch {}
  }, [currentView]);

  // Synchronize view state with user authentication status
  React.useEffect(() => {
    if (currentUser) {
      if (currentView === 'auth') {
        setCurrentView('portal');
      }
    } else {
      const hasStoredSession =
        typeof window !== 'undefined' &&
        (!!localStorage.getItem(STORAGE_KEYS.USER_ID) ||
         !!localStorage.getItem('alumni_auth_session_real_v1'));
      if (!hasStoredSession && currentView === 'portal') {
        setCurrentView('auth');
      }
    }
  }, [currentUser, currentView]);

  React.useEffect(() => {
    // Prioritize Profile Setup on first-time login
    if (
      currentUser &&
      currentUser.role === 'alumni' &&
      (!currentUser.isProfileSetupCompleted || !currentUser.currentPosition || !currentUser.company)
    ) {
      const dismissed = sessionStorage.getItem(`dismissed_setup_${currentUser.uid}`);
      if (!dismissed) {
        setShowProfileSetupModal(true);
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (role?: string) => {
    setCurrentView('portal');
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, 'portal');
    } catch {}
    if (role && ['admin', 'registrar', 'staff', 'moderator'].includes(role)) {
      setActiveTab('admin');
    } else if (role === 'employer') {
      setActiveTab('employer_portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Landing page view (when user explicitly chooses to view public site)
  if (currentView === 'landing') {
    return (
      <LandingPage
        onNavigateToAuth={(mode, role = 'alumni') => {
          setAuthViewMode(mode);
          setAuthRole(role);
          setCurrentView('auth');
        }}
      />
    );
  }

  // Authentication page view (login or multi-role registration)
  if (currentView === 'auth') {
    return (
      <AuthPage
        initialMode={authViewMode}
        initialRole={authRole}
        onLoginSuccess={handleLoginSuccess}
        onBackToApp={() => {
          if (currentUser) {
            handleLoginSuccess(currentUser.role);
          } else {
            setCurrentView('landing');
          }
        }}
      />
    );
  }

  // Protected Member Portal View (Mandatory authentication - no direct access to dashboard)
  if (!currentUser) {
    const hasStoredSession =
      typeof window !== 'undefined' &&
      (!!localStorage.getItem(STORAGE_KEYS.USER_ID) ||
       !!localStorage.getItem('alumni_auth_session_real_v1'));

    if (hasStoredSession) {
      return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-stone-200 border-t-[#8B181B] animate-spin" />
            <p className="text-xs font-semibold text-stone-600">Restoring your Cecilian session...</p>
          </div>
        </div>
      );
    }

    return (
      <AuthPage
        initialMode="login"
        onLoginSuccess={handleLoginSuccess}
        onBackToApp={() => setCurrentView('landing')}
      />
    );
  }

  // Member Portal View (Authenticated)
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-[#111827] antialiased selection:bg-[#991B1B] selection:text-white">
      {/* Top Global Header */}
      <Header
        onOpenAuth={(mode) => {
          setAuthViewMode(mode);
          setCurrentView('auth');
        }}
        onGoToLanding={() => setCurrentView('landing')}
      />

      {/* Main Navigation Bar */}
      <Navigation
        onOpenAuth={(mode) => {
          setAuthViewMode(mode);
          setCurrentView('auth');
        }}
      />

      {/* Primary Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'network' && (
              <VerificationGate routeName="Alumni Directory & Networking">
                <NetworkView />
              </VerificationGate>
            )}
            {activeTab === 'messages' && (
              <VerificationGate routeName="Direct Peer Messaging">
                <MessagesView />
              </VerificationGate>
            )}
            {activeTab === 'events' && (
              <VerificationGate routeName="Campus Reunions & Official Events">
                <EventsView />
              </VerificationGate>
            )}
            {activeTab === 'announcements' && (
              <VerificationGate routeName="Institutional Announcements">
                <AnnouncementsView />
              </VerificationGate>
            )}
            {activeTab === 'opportunities' && (
              <VerificationGate routeName="Career Opportunities & Job Board">
                <OpportunitiesView />
              </VerificationGate>
            )}
            {activeTab === 'employer_portal' && <EmployerDashboardView />}
            {activeTab === 'profile' && <ProfileView />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'admin' && <AdminPanelView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Public Profile Modal (Available anywhere in the app) */}
      <PublicProfileModal />

      {/* Priority First-Time Profile Setup Modal */}
      <FirstTimeProfileSetupModal
        isOpen={showProfileSetupModal}
        onClose={() => {
          setShowProfileSetupModal(false);
          if (currentUser) {
            sessionStorage.setItem(`dismissed_setup_${currentUser.uid}`, 'true');
          }
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/cecilians-seal.jpg"
              alt="Alumni Cecilian's Logo"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-stone-200 shadow-2xs shrink-0"
            />
            <span className="font-bold text-[#111827]">St. Cecilia's College Global Alumni Association</span>
            <span>•</span>
            <span>Official Institutional Network</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-stone-500 font-medium">St. Cecilia’s College - Cebu, Inc.</span>
            <span>•</span>
            <span className="text-stone-400">© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AlumniProvider>
      <AppContent />
      <ToastContainer />
    </AlumniProvider>
  );
}

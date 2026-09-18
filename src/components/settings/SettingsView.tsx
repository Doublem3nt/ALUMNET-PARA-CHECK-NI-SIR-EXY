import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Bell,
  HelpCircle,
  Shield,
  Info,
  LogOut,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    logout,
    deleteAccount,
    notificationSettings,
    updateNotificationSettings
  } = useAlumni();

  const [copiedId, setCopiedId] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Email form
  const [newEmail, setNewEmail] = useState('');
  const [emailStatusMessage, setEmailStatusMessage] = useState('');

  // Password form
  const [passwordStatusMessage, setPasswordStatusMessage] = useState('');

  // Notification toggles with safe optional chaining and fallback to global notificationSettings
  const [pushEnabled, setPushEnabled] = useState(
    currentUser?.settings?.notificationsPush ?? notificationSettings?.pushNotifications ?? true
  );
  const [emailEnabled, setEmailEnabled] = useState(
    currentUser?.settings?.notificationsEmail ?? notificationSettings?.emailDigests ?? true
  );
  const [messagesEnabled, setMessagesEnabled] = useState(
    currentUser?.settings?.notificationsMessages ?? notificationSettings?.directMessages ?? true
  );
  const [eventsEnabled, setEventsEnabled] = useState(
    currentUser?.settings?.notificationsEvents ?? notificationSettings?.eventReminders ?? true
  );

  useEffect(() => {
    if (notificationSettings) {
      setPushEnabled(notificationSettings.pushNotifications ?? true);
      setEmailEnabled(notificationSettings.emailDigests ?? true);
      setMessagesEnabled(notificationSettings.directMessages ?? true);
      setEventsEnabled(notificationSettings.eventReminders ?? true);
    }
  }, [notificationSettings]);

  if (!currentUser) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(currentUser.uid);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggle = (key: 'push' | 'email' | 'messages' | 'events', value: boolean) => {
    if (key === 'push') {
      setPushEnabled(value);
      updateNotificationSettings({ pushNotifications: value });
    }
    if (key === 'email') {
      setEmailEnabled(value);
      updateNotificationSettings({ emailDigests: value });
    }
    if (key === 'messages') {
      setMessagesEnabled(value);
      updateNotificationSettings({ directMessages: value });
    }
    if (key === 'events') {
      setEventsEnabled(value);
      updateNotificationSettings({ eventReminders: value });
    }
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;
    setEmailStatusMessage(`Verification email sent to ${newEmail}. Please confirm to complete change.`);
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailStatusMessage('');
      setNewEmail('');
    }, 2500);
  };

  const handleSendPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatusMessage(`Password reset link dispatched to ${currentUser.email}. Follow link to set new password.`);
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordStatusMessage('');
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          Account Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Manage your security credentials, notification channels, privacy controls, and support.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
          Account Overview
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.profilePictureUrl}
              alt={currentUser.name}
              className="w-14 h-14 rounded-full object-cover border border-stone-300"
            />
            <div>
              <h3 className="text-sm font-bold text-stone-900">{currentUser.name}</h3>
              <p className="text-xs text-stone-500">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {currentUser.role}
                </span>
                <span className="text-[11px] text-stone-400">UID: {currentUser.uid.slice(0, 12)}...</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-medium transition-colors"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId ? 'Copied UID' : 'Copy UID for Support'}</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Security & Credentials */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
          Security & Access
        </h2>

        <div className="divide-y divide-stone-100">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-stone-500" />
              <div>
                <p className="text-xs font-semibold text-stone-800">Email Address</p>
                <p className="text-xs text-stone-500">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowEmailModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Change Email
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-stone-500" />
              <div>
                <p className="text-xs font-semibold text-stone-800">Account Password</p>
                <p className="text-xs text-stone-500">Secured with email verification</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-stone-600" />
          <span>Notification Preferences</span>
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-800">Push Notifications</p>
              <p className="text-xs text-stone-500">Real-time alerts for friend requests and event changes</p>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => handleToggle('push', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-800">Email Digest & Broadcasts</p>
              <p className="text-xs text-stone-500">Monthly alumni newsletter, reunion invitations, and jobs</p>
            </div>
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => handleToggle('email', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-800">Direct Messages</p>
              <p className="text-xs text-stone-500">Notify when another alumnus or staff sends a message</p>
            </div>
            <input
              type="checkbox"
              checked={messagesEnabled}
              onChange={(e) => handleToggle('messages', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-800">Campus Events & Reunions</p>
              <p className="text-xs text-stone-500">Reminders for events you RSVP'd "Going" or "Interested"</p>
            </div>
            <input
              type="checkbox"
              checked={eventsEnabled}
              onChange={(e) => handleToggle('events', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>
        </div>
      </div>

      {/* Help, FAQ & Support */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
          Help & Information
        </h2>

        <div className="divide-y divide-stone-100">
          <button
            onClick={() => setShowFaqModal(true)}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-stone-500" />
              <div>
                <p className="text-xs font-semibold text-stone-800">Frequently Asked Questions (FAQ)</p>
                <p className="text-xs text-stone-500">Rules for connection requests, events, and job postings</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <a
            href="mailto:support@alumni.edu?subject=Alumni%20Portal%20Support%20Inquiry"
            className="w-full py-3 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-stone-500" />
              <div>
                <p className="text-xs font-semibold text-stone-800">Contact Alumni Support</p>
                <p className="text-xs text-stone-500">Email support@alumni.edu for registrar records or chapter help</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-stone-400" />
          </a>

          <button
            onClick={() => setShowPrivacyModal(true)}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-stone-500" />
              <div>
                <p className="text-xs font-semibold text-stone-800">Privacy Policy</p>
                <p className="text-xs text-stone-500">How alumni directory data and contact info are handled</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            onClick={() => setShowAboutModal(true)}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-stone-500" />
              <div>
                <p className="text-xs font-semibold text-stone-800">About Alumni Network</p>
                <p className="text-xs text-stone-500">Version 2.4.0 • University Association</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/40 rounded-2xl border border-red-200 p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-3">
          Session & Account Actions
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-stone-600" />
            <span>Log Out</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* CHANGE EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Change Account Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>
            {emailStatusMessage ? (
              <div className="my-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                {emailStatusMessage}
              </div>
            ) : (
              <form onSubmit={handleChangeEmail} className="mt-4 space-y-3">
                <p className="text-stone-600">Current email: <span className="font-bold">{currentUser.email}</span></p>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">New Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new.email@domain.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-3 py-1.5 bg-stone-100 rounded-lg text-stone-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Send Verification
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Reset Account Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>
            {passwordStatusMessage ? (
              <div className="my-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                {passwordStatusMessage}
              </div>
            ) : (
              <form onSubmit={handleSendPasswordReset} className="mt-4 space-y-3">
                <p className="text-stone-600 leading-relaxed">
                  We will dispatch a secure password reset link to your registered email address:{' '}
                  <span className="font-bold">{currentUser.email}</span>.
                </p>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-3 py-1.5 bg-stone-100 rounded-lg text-stone-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FAQ MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-stone-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Frequently Asked Questions</h3>
              <button onClick={() => setShowFaqModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4 text-xs text-stone-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-stone-900">Who can connect with who?</h4>
                <p className="mt-1">
                  Connections are strictly alumni-to-alumni. Staff, registrars, and faculty can follow alumni, participate in discussions, and send direct messages.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-stone-900">How do I verify my degree?</h4>
                <p className="mt-1">
                  Registrars routinely verify student records against university archives. You can also contact support@alumni.edu with your student ID.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-stone-900">Who can create events and announcements?</h4>
                <p className="mt-1">
                  Admins, Registrars, Staff members, and Moderators have publishing permissions for events and official broadcasts.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-stone-900">How can I post jobs on the Alumni Board?</h4>
                <p className="mt-1">
                  Any verified alumni or staff member can post full-time, internship, or mentorship roles directly from the Job Board tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-stone-200 max-h-[85vh] overflow-y-auto text-xs text-stone-700 leading-relaxed">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Privacy Policy & Directory Rules</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <p>
                The Alumni Network protects member confidentiality. Personal phone numbers and private email addresses are never exposed to public search crawlers.
              </p>
              <p>
                Directory information is visible only to authenticated alumni, verified faculty, and authorized university administrators.
              </p>
              <p>
                You may update your visibility preferences or delete your account data permanently at any time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-stone-200 text-center text-xs">
            <h3 className="text-base font-bold text-stone-900">University Alumni Network</h3>
            <p className="text-stone-500 mt-1">Version 2.4.0 (Production Build)</p>
            <p className="text-stone-600 mt-4 leading-relaxed">
              Empowering over 85,000 university graduates across 64 global chapters with lifelong mentorship, career growth, and community.
            </p>
            <button
              onClick={() => setShowAboutModal(false)}
              className="mt-6 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-stone-200 text-xs text-center">
            <LogOut className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-stone-900">Log Out Confirmation</h3>
            <p className="text-stone-500 mt-1">Are you sure you want to end your active session?</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-stone-100 rounded-lg font-medium text-stone-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT DOUBLE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-red-200 text-xs">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-red-900">Permanently Delete Account?</h3>
            </div>
            <p className="text-stone-600 leading-relaxed">
              This action is permanent and irreversible. Your alumni profile, event RSVPs, job postings, and messages will be removed.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-stone-100 rounded-lg text-stone-700 font-medium"
              >
                Keep Account
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  deleteAccount();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

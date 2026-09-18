import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  FriendRequest,
  ChatThread,
  ChatMessage,
  AppNotification,
  AlumniEvent,
  Announcement,
  Opportunity,
  JobApplication,
  ApplicationStatus,
  Chapter,
  CareerMilestone,
  UserNotificationSettings,
  Experience,
  Education,
  GalleryItem,
  ToastType,
  ToastNotification,
  AuditLogEntry,
  AutomationJob,
  CareerSurveyResponse,
  DatabaseBackupSnapshot,
  EventAttendee,
  EventAttendanceRecord,
  RegistrarVerificationResult
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_CHATS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_OPPORTUNITIES,
  INITIAL_JOB_APPLICATIONS,
  INITIAL_CHAPTERS,
  INITIAL_MILESTONES,
  INITIAL_GALLERY_ITEMS,
  INITIAL_AUDIT_LOGS,
  INITIAL_AUTOMATION_JOBS,
  INITIAL_CAREER_SURVEYS,
  INITIAL_BACKUPS
} from '../data/initialData';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveUserToFirestore,
  getUserFromFirestore,
  subscribeToUsers,
  saveFriendRequestToFirestore,
  deleteFriendRequestFromFirestore,
  subscribeToFriendRequests,
  saveEventToFirestore,
  deleteEventFromFirestore,
  subscribeToEvents,
  saveOpportunityToFirestore,
  deleteOpportunityFromFirestore,
  subscribeToOpportunities,
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  subscribeToAnnouncements,
  saveChatToFirestore,
  saveChatMessageToFirestore,
  saveNotificationToFirestore,
  saveConnectionToFirestore,
  subscribeToUserChats,
  subscribeToChatMessages,
  saveAuditLogToFirestore,
  saveGalleryItemToFirestore,
  deleteGalleryItemFromFirestore,
  syncAllCollectionsToFirestore
} from '../lib/firebase';
import {
  markRegistryRecordAsRegistered,
  getRegistrarRecords,
  isValidStudentIdPattern,
  normalizeStudentId,
  syncRegistrarRecordsWithFirestore,
  generateAlumniId
} from '../services/studentVerificationService';
import { alumniService } from '../services/alumniService';
import { checkAnniversariesAndGreetings, calculateProfileCompletion } from '../services/automationService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AlumniContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  friendRequests: FriendRequest[];
  chats: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  notifications: AppNotification[];
  events: AlumniEvent[];
  announcements: Announcement[];
  opportunities: Opportunity[];
  chapters: Chapter[];
  milestones: CareerMilestone[];
  notificationSettings: UserNotificationSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedUserIdForModal: string | null;
  setSelectedUserIdForModal: (uid: string | null) => void;
  isFirebaseConnected: boolean;
  isFirestoreSyncing: boolean;
  loginWithGoogle: () => Promise<boolean>;
  syncAllDataToCloud: () => Promise<void>;
  
  // Permissions derived from current user role (from Role Permissions Summary)
  permissions: {
    canSendFriendRequests: boolean;
    canFollow: boolean;
    canCreateEvents: boolean;
    canPostAnnouncements: boolean;
    canDeleteEventsComments: boolean;
    canAccessAdminPanel: boolean;
    canMessageAnyone: boolean;
    canUploadGallery: boolean;
    canManageJobModeration: boolean;
    canPostJobs: boolean;
    canAccessEmployerDashboard: boolean;
    canAccessRegistry: boolean;
    canAccessConflictResolution: boolean;
    canAccessEmployerAccreditation: boolean;
    canAccessAuditTrails: boolean;
    canAccessAutomations: boolean;
    canAccessGrowthAnalytics: boolean;
    canAssignRoles: boolean;
    canVerifyAlumni: boolean;
    canManageChapters: boolean;
  };

  // Auth & Session
  login: (email: string, pass: string) => boolean;
  register: (data: Partial<UserProfile> & { password?: string }) => boolean;
  createUserByAdmin: (data: Partial<UserProfile> & { password?: string; role: UserRole }) => boolean;
  logout: () => void;
  switchUser: (uid: string) => void;
  resetPassword: (email: string) => boolean;
  resetUserPasswordByEmail: (email: string, newPass: string) => boolean;
  deleteAccount: () => boolean;
  changeEmail: (newEmail: string) => boolean;
  changePassword: (newPass: string) => boolean;

  // Profile
  updateProfile: (data: Partial<UserProfile>) => void;
  addExperience: (exp: Omit<Experience, 'id'>) => void;
  removeExperience: (id: string) => void;
  addEducation: (edu: Omit<Education, 'id'>) => void;
  removeEducation: (id: string) => void;

  // Friends & Network
  followingIds: string[];
  connectionIds: string[];
  sendFriendRequest: (targetUid: string) => { success: boolean; error?: string };
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  cancelFriendRequest: (requestId: string) => void;
  toggleFollow: (targetUid: string) => void;
  isFollowing: (uid: string) => boolean;
  isConnected: (uid: string) => boolean;
  hasPendingRequestWith: (uid: string) => 'sent' | 'received' | false;

  // Messaging
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  sendMessage: (chatId: string, text: string) => void;
  getOrCreateChat: (targetUid: string) => string;
  markChatAsRead: (chatId: string) => void;

  // Events
  createEvent: (event: Omit<AlumniEvent, 'id' | 'likes' | 'comments' | 'attendeesCount' | 'createdBy' | 'createdByName'>) => void;
  editEvent: (eventId: string, data: Partial<AlumniEvent>) => void;
  deleteEvent: (eventId: string) => void;
  toggleLikeEvent: (eventId: string) => void;
  addCommentToEvent: (eventId: string, text: string) => void;
  rsvpEvent: (eventId: string, status: 'going' | 'interested' | 'not_going') => void;
  updateEventAttendance: (eventId: string, uid: string, status: 'attended' | 'not_attended' | 'pending') => void;

  // Announcements
  createAnnouncement: (data: Omit<Announcement, 'id' | 'publishedAt' | 'createdBy' | 'authorName' | 'authorRole'>) => void;
  editAnnouncement: (id: string, data: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;

  // Opportunities & Career Portal
  jobApplications: JobApplication[];
  createOpportunity: (data: Omit<Opportunity, 'id' | 'createdAt' | 'postedBy' | 'posterName' | 'status'>) => void;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
  approveOpportunity: (id: string) => void;
  rejectOpportunity: (id: string, reason: string) => void;
  applyForJob: (data: Omit<JobApplication, 'id' | 'appliedAt' | 'status'>) => { success: boolean; error?: string };
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, notes?: string) => void;
  verifyEmployer: (employerUid: string, verified: boolean, notes?: string) => void;
  toggleEmployerJobPosting: (employerUid: string, canPost: boolean) => void;
  selfVerifyAlumniWithRegistry: (studentId: string) => Promise<{ success: boolean; message: string }>;
  isAlumniVerified: boolean;
  registrar_verification: (studentIdToCheck?: string, candidateName?: string) => RegistrarVerificationResult;
  verifyAlumniStatus: (studentIdToVerify: string) => Promise<RegistrarVerificationResult>;
  getConnectionStatus: (otherUid: string) => 'pending' | 'accepted' | 'declined' | null;

  // Notifications
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  // Settings
  updateNotificationSettings: (settings: Partial<UserNotificationSettings>) => void;
  updateUserSettings: (settings: any) => void;

  // Campus & Heritage Gallery
  galleryItems: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'createdAt'>) => boolean;
  deleteGalleryItem: (id: string) => boolean;

  // Alumni Directory Service (direct Firestore service layer)
  fetchAlumni: () => Promise<UserProfile[]>;
  createAlumni: (profile: UserProfile) => Promise<UserProfile | undefined>;
  updateAlumniProfile: (uid: string, updates: Partial<UserProfile>) => Promise<Partial<UserProfile> | undefined>;

  // Admin Actions
  verifyUser: (uid: string) => void;
  setUserVerified: (uid: string, status?: boolean) => void;
  updateUserRole: (uid: string, newRole: UserRole) => void;
  setUserRole: (uid: string, newRole: UserRole) => void;
  deleteAlumni: (uid: string) => Promise<boolean>;
  createChapter: (ch: Omit<Chapter, 'id'>) => void;
  createMilestone: (m: Omit<CareerMilestone, 'id'>) => void;
  toggleLikeMilestone: (milestoneId: string) => void;
  deleteMilestone: (milestoneId: string) => void;
  isEmployerExpired: (user?: UserProfile | null) => boolean;
  requestEmployerRenewal: (notes: string) => void;
  renewEmployerAccount: (uid: string, extensionMonths?: number) => void;
  checkAndEnforceEmployerExpirations: () => { expiredCount: number; warningsCount: number };

  // Alumni Management Automations
  auditLogs: AuditLogEntry[];
  automationJobs: AutomationJob[];
  careerSurveys: CareerSurveyResponse[];
  backups: DatabaseBackupSnapshot[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  submitCareerSurvey: (survey: Omit<CareerSurveyResponse, 'id' | 'submittedAt'>) => void;
  runAutomationJob: (jobId: string) => void;
  triggerDatabaseBackup: (type?: 'automated' | 'manual') => void;
  unlockUserAccount: (uid: string) => void;
  verifyAndApproveAlumni: (uid: string, approve: boolean, flagReason?: string) => void;
  sendEmergencyAnnouncement: (title: string, content: string) => void;
  updateEmploymentStatus: (status: 'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired') => void;

  // Toast / System Feedback
  toasts: ToastNotification[];
  toastMessage: string | null;
  showToast: (msg: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

const AlumniContext = createContext<AlumniContextType | null>(null);

const STORAGE_KEYS = {
  USER_ID: 'alumni_auth_session_real_v2',
  USERS: 'alumni_users_v5',
  REQUESTS: 'alumni_friend_requests_v5',
  CHATS: 'alumni_chats_v5',
  MESSAGES: 'alumni_messages_v5',
  NOTIFICATIONS: 'alumni_notifications_v5',
  EVENTS: 'alumni_events_v5',
  ANNOUNCEMENTS: 'alumni_announcements_v5',
  OPPORTUNITIES: 'alumni_opportunities_v5',
  APPLICATIONS: 'alumni_job_applications_v5',
  CHAPTERS: 'alumni_chapters_v5',
  MILESTONES: 'alumni_milestones_v5',
  FOLLOWING: 'alumni_following_v5',
  CONNECTIONS: 'alumni_connections_v5',
  SETTINGS: 'alumni_settings_v5',
  GALLERY: 'alumni_gallery_v5',
  AUDIT_LOGS: 'alumni_audit_logs_v2',
  AUTOMATION_JOBS: 'alumni_automation_jobs_v2',
  CAREER_SURVEYS: 'alumni_career_surveys_v2',
  BACKUPS: 'alumni_backups_v2'
};

export const AlumniProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load or fallback to initial data
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      let list: UserProfile[] = saved ? JSON.parse(saved) : INITIAL_USERS;
      if (!Array.isArray(list)) list = INITIAL_USERS;

      // Always sanitize experience and education arrays
      list = list.map((u) => ({
        ...u,
        experience: Array.isArray(u.experience) ? u.experience : [],
        education: Array.isArray(u.education) ? u.education : []
      }));

      // Always guarantee the admin account exists with admin role & password
      const adminExists = list.some(u => u.email.toLowerCase() === 'admin@stcecilia.edu');
      if (!adminExists) {
        const adminUser = INITIAL_USERS.find(u => u.email === 'admin@stcecilia.edu');
        if (adminUser) list = [adminUser, ...list];
      } else {
        list = list.map(u =>
          u.email.toLowerCase() === 'admin@stcecilia.edu'
            ? { ...u, role: 'admin', password: u.password || 'Password123!', isVerified: true }
            : u
        );
      }

      // Always guarantee the registrar account exists
      const regExists = list.some(u => u.email.toLowerCase() === 'registrar@stcecilia.edu');
      if (!regExists) {
        const regUser = INITIAL_USERS.find(u => u.email === 'registrar@stcecilia.edu');
        if (regUser) list = [...list, regUser];
      }

      // Always ensure all seed INITIAL_USERS are present in the list (so newly added directory alumni are always available)
      INITIAL_USERS.forEach((initU) => {
        const idx = list.findIndex(u => u.uid === initU.uid || u.email.toLowerCase() === initU.email.toLowerCase());
        if (idx === -1) {
          list.push(initU);
        } else {
          // Merge rich details if needed
          list[idx] = {
            ...initU,
            ...list[idx],
            role: list[idx].role || initU.role,
            password: list[idx].password || initU.password
          };
        }
      });

      return list;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Real system: unauthenticated by default, requires legitimate login
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_ID);
      return saved || null;
    } catch {
      return null;
    }
  });

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_FRIEND_REQUESTS;
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_FRIEND_REQUESTS;
      
      const combined = [...parsed];
      INITIAL_FRIEND_REQUESTS.forEach((ir) => {
        if (!combined.some((r) => r.id === ir.id)) {
          combined.push(ir);
        }
      });
      return combined;
    } catch {
      return INITIAL_FRIEND_REQUESTS;
    }
  });

  const [chats, setChats] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_CHATS;
      const list = Array.isArray(parsed) ? parsed : INITIAL_CHATS;
      return list.filter((c: ChatThread) => c.id !== 'chat_admin_alumni');
    } catch {
      return INITIAL_CHATS;
    }
  });

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const parsed = saved ? JSON.parse(saved) : INITIAL_MESSAGES;
      const copy = { ...parsed };
      delete copy.chat_admin_alumni;
      return copy;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
      return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [events, setEvents] = useState<AlumniEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_EVENTS;
      if (!Array.isArray(parsed)) return INITIAL_EVENTS;
      return parsed.map((e: AlumniEvent) => ({
        ...e,
        likes: Array.isArray(e.likes) ? e.likes : [],
        comments: Array.isArray(e.comments) ? e.comments : []
      }));
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
      return Array.isArray(parsed) ? parsed : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
      const parsed = saved ? JSON.parse(saved) : INITIAL_OPPORTUNITIES;
      if (!Array.isArray(parsed)) return INITIAL_OPPORTUNITIES;
      return parsed.map((opp: Opportunity) => ({
        ...opp,
        skills: Array.isArray(opp.skills) ? opp.skills : ['Leadership', 'Communication', 'Industry Specialization']
      }));
    } catch {
      return INITIAL_OPPORTUNITIES;
    }
  });

  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_JOB_APPLICATIONS;
      return Array.isArray(parsed) ? parsed : INITIAL_JOB_APPLICATIONS;
    } catch {
      return INITIAL_JOB_APPLICATIONS;
    }
  });

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_CHAPTERS;
      return Array.isArray(parsed) ? parsed : INITIAL_CHAPTERS;
    } catch {
      return INITIAL_CHAPTERS;
    }
  });

  const [milestones, setMilestones] = useState<CareerMilestone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MILESTONES);
      const parsed = saved ? JSON.parse(saved) : INITIAL_MILESTONES;
      return Array.isArray(parsed) ? parsed : INITIAL_MILESTONES;
    } catch {
      return INITIAL_MILESTONES;
    }
  });

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GALLERY);
      const parsed = saved ? JSON.parse(saved) : INITIAL_GALLERY_ITEMS;
      return Array.isArray(parsed) ? parsed : INITIAL_GALLERY_ITEMS;
    } catch {
      return INITIAL_GALLERY_ITEMS;
    }
  });

  // Connections mapping: userUid -> array of connected uids
  const [connectionsMap, setConnectionsMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (saved) return JSON.parse(saved);
      return {
        user_default_alumni: [],
        user_default_admin: []
      };
    } catch {
      return {
        user_default_alumni: [],
        user_default_admin: []
      };
    }
  });

  // Following mapping: userUid -> array of uids being followed
  const [followingMap, setFollowingMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLLOWING);
      if (saved) return JSON.parse(saved);
      return {
        user_default_alumni: ['user_default_admin'],
        user_default_admin: []
      };
    } catch {
      return {
        user_default_alumni: ['user_default_admin'],
        user_default_admin: []
      };
    }
  });

  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
      return {
        pushNotifications: true,
        emailDigests: true,
        directMessages: true,
        eventReminders: true
      };
    } catch {
      return {
        pushNotifications: true,
        emailDigests: true,
        directMessages: true,
        eventReminders: true
      };
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedUserIdForModal, setSelectedUserIdForModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Automation datasets
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [automationJobs, setAutomationJobs] = useState<AutomationJob[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTOMATION_JOBS);
      return saved ? JSON.parse(saved) : INITIAL_AUTOMATION_JOBS;
    } catch {
      return INITIAL_AUTOMATION_JOBS;
    }
  });

  const [careerSurveys, setCareerSurveys] = useState<CareerSurveyResponse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAREER_SURVEYS);
      return saved ? JSON.parse(saved) : INITIAL_CAREER_SURVEYS;
    } catch {
      return INITIAL_CAREER_SURVEYS;
    }
  });

  const [backups, setBackups] = useState<DatabaseBackupSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUPS);
      return saved ? JSON.parse(saved) : INITIAL_BACKUPS;
    } catch {
      return INITIAL_BACKUPS;
    }
  });

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastNotification = { id, message: msg, type };

    setToastMessage(msg);
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(friendRequests));
  }, [friendRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(jobApplications));
  }, [jobApplications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connectionsMap));
  }, [connectionsMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(followingMap));
  }, [followingMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(galleryItems));
  }, [galleryItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTOMATION_JOBS, JSON.stringify(automationJobs));
  }, [automationJobs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAREER_SURVEYS, JSON.stringify(careerSurveys));
  }, [careerSurveys]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  }, [backups]);

  // Firebase Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);
      if (fbUser) {
        setIsFirebaseConnected(true);
        let matched = users.find(
          (u) => u.uid === fbUser.uid || (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
        );
        if (!matched) {
          matched = (await getUserFromFirestore(fbUser.uid)) || undefined;
        }
        if (matched) {
          setCurrentUserId(matched.uid);
        } else {
          const email = fbUser.email || '';
          const role: UserRole = email.includes('admin') || email.includes('superadmin')
            ? 'admin'
            : email.includes('registrar')
            ? 'registrar'
            : 'alumni';

          const newProfile: UserProfile = {
            uid: fbUser.uid,
            name: fbUser.displayName || email.split('@')[0] || 'Cecilian Alumnus',
            email,
            role,
            batch: role === 'alumni' ? '2024' : 'N/A',
            course: role === 'alumni' ? 'B.S. Information Technology' : 'Academic Administration',
            location: 'Cebu, Philippines',
            profilePictureUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
            headline: `${role === 'alumni' ? 'B.S. Information Technology Graduate' : role.toUpperCase() + ' Specialist'} • St. Cecilia’s College`,
            about: 'Member of St. Cecilia’s College Alumni Community connected with Google Authentication.',
            phone: '',
            isVerified: true,
            followersCount: 0,
            followingCount: 0,
            connectionsCount: 0,
            experience: [],
            education: [],
            createdAt: new Date().toISOString(),
            authProvider: 'google'
          };
          setUsers((prev) => [newProfile, ...prev]);
          setCurrentUserId(newProfile.uid);
          saveUserToFirestore(newProfile).catch(() => {});
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Subscriptions & Initial Seeding via alumniService
  useEffect(() => {
    let isSubscribed = true;

    // Fetch live alumni directory directly from Firestore instance on load
    const fetchAlumniFromFirestore = async () => {
      try {
        const firestoreUsers = await alumniService.getAllAlumni();
        if (isSubscribed && firestoreUsers && firestoreUsers.length > 0) {
          setUsers(firestoreUsers);
        }
      } catch (err) {
        console.warn('Initial Firestore alumni load notice:', err);
      }
    };
    fetchAlumniFromFirestore();

    // Subscribe to real-time alumni directory directly from Firestore
    const unsubUsers = alumniService.subscribeToAlumniDirectory(
      (firestoreUsers) => {
        if (isSubscribed && firestoreUsers && firestoreUsers.length > 0) {
          setUsers(firestoreUsers);
        }
      },
      (error) => {
        console.warn('Alumni Directory Firestore subscription notice:', error);
      }
    );

    const unsubEvents = subscribeToEvents((firestoreEvents) => {
      if (firestoreEvents.length > 0 && isSubscribed) {
        setEvents((prev) => {
          const merged = [...prev];
          firestoreEvents.forEach((fe) => {
            const idx = merged.findIndex((e) => e.id === fe.id);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...fe };
            } else {
              merged.push(fe);
            }
          });
          return merged;
        });
      }
    });

    const unsubOpps = subscribeToOpportunities((firestoreOpps) => {
      if (firestoreOpps.length > 0 && isSubscribed) {
        setOpportunities((prev) => {
          const merged = [...prev];
          firestoreOpps.forEach((fo) => {
            const idx = merged.findIndex((o) => o.id === fo.id);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...fo };
            } else {
              merged.push(fo);
            }
          });
          return merged;
        });
      }
    });

    const unsubAnn = subscribeToAnnouncements((firestoreAnns) => {
      if (firestoreAnns.length > 0 && isSubscribed) {
        setAnnouncements((prev) => {
          const merged = [...prev];
          firestoreAnns.forEach((fa) => {
            const idx = merged.findIndex((a) => a.id === fa.id);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...fa };
            } else {
              merged.push(fa);
            }
          });
          return merged;
        });
      }
    });

    const unsubReqs = subscribeToFriendRequests((firestoreReqs) => {
      if (firestoreReqs.length > 0 && isSubscribed) {
        setFriendRequests((prev) => {
          const merged = [...prev];
          firestoreReqs.forEach((fr) => {
            const idx = merged.findIndex((r) => r.id === fr.id);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...fr };
            } else {
              merged.push(fr);
            }
          });
          return merged;
        });
      }
    });

    // Background seeding of initial data to Firestore replacing empty collection state
    const seedFirestore = async () => {
      try {
        setIsFirestoreSyncing(true);
        // Seed directory if empty via alumniService
        await alumniService.seedDirectoryIfEmpty(INITIAL_USERS);

        // Ensure official student registry records are seeded to Firestore
        await syncRegistrarRecordsWithFirestore().catch((err) => {
          console.warn('Initial Registrar records sync notice:', err);
        });

        for (const ev of INITIAL_EVENTS) {
          saveEventToFirestore(ev).catch(() => {});
        }
        for (const op of INITIAL_OPPORTUNITIES) {
          saveOpportunityToFirestore(op).catch(() => {});
        }
        for (const an of INITIAL_ANNOUNCEMENTS) {
          saveAnnouncementToFirestore(an).catch(() => {});
        }
        for (const req of INITIAL_FRIEND_REQUESTS) {
          saveFriendRequestToFirestore(req).catch(() => {});
        }
      } catch (err) {
        console.warn('Initial Firestore sync notice:', err);
      } finally {
        if (isSubscribed) {
          setIsFirestoreSyncing(false);
        }
      }
    };

    seedFirestore();

    return () => {
      isSubscribed = false;
      unsubUsers();
      unsubEvents();
      unsubOpps();
      unsubAnn();
      unsubReqs();
    };
  }, []);

  // Current User resolution
  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return users.find((u) => u.uid === currentUserId) || null;
  }, [currentUserId, users]);

  // Real-time Peer-to-Peer Chat Subscription (strictly member-scoped)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToUserChats(currentUser.uid, (cloudChats) => {
      if (cloudChats) {
        setChats((prev) => {
          const map = new Map<string, ChatThread>();
          prev.forEach((c) => {
            if (c.memberIds.includes(currentUser.uid) && c.id !== 'chat_admin_alumni') {
              map.set(c.id, c);
            }
          });
          cloudChats.forEach((c) => {
            if (c.memberIds.includes(currentUser.uid) && c.id !== 'chat_admin_alumni') {
              map.set(c.id, { ...(map.get(c.id) || {}), ...c });
            }
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
          );
        });
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Real-time Chat Messages Subscription for Active Thread
  useEffect(() => {
    if (!activeChatId) return;
    const unsub = subscribeToChatMessages(activeChatId, (cloudMsgs) => {
      if (cloudMsgs && cloudMsgs.length > 0) {
        setMessages((prev) => ({
          ...prev,
          [activeChatId]: cloudMsgs
        }));
      }
    });
    return () => unsub();
  }, [activeChatId]);

  // Automated milestone greetings & profile completion check on session start
  useEffect(() => {
    if (!currentUser) return;
    const sessionKey = `greeted_${currentUser.uid}_${new Date().toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, 'true');

    // 1. Check milestone or birthday
    const greetings = checkAnniversariesAndGreetings(currentUser);
    if (greetings.isBirthday && greetings.birthdayGreeting) {
      const notif: AppNotification = {
        id: `notif_greet_bday_${Date.now()}`,
        toUid: currentUser.uid,
        type: 'general',
        title: '🎂 Happy Birthday!',
        body: greetings.birthdayGreeting,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [notif, ...prev]);
      showToast('🎂 Happy Birthday from St. Cecilia’s College!', 'success');
    }

    if (greetings.anniversaryGreeting) {
      const notif: AppNotification = {
        id: `notif_greet_anni_${Date.now()}`,
        toUid: currentUser.uid,
        type: 'general',
        title: greetings.isMilestone ? `🎉 ${greetings.milestoneTitle}` : '🎓 Graduation Milestone',
        body: greetings.anniversaryGreeting,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    // 2. Profile completion reminder if < 70%
    const completion = calculateProfileCompletion(currentUser);
    if (completion.percentage < 70 && !currentUser.lastProfileUpdateReminder) {
      const missingList = completion.missingFields.slice(0, 3).join(', ');
      const notif: AppNotification = {
        id: `notif_prof_${Date.now()}`,
        type: 'profile_update',
        title: 'Complete Your Cecilian Alumni Profile',
        body: `Your profile is ${completion.percentage}% complete. Adding your ${missingList} boosts networking and job matching!`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  }, [currentUser, showToast]);

  // Role Permissions Summary (derived strictly according to the user specification and image)
  const permissions = useMemo(() => {
    const role = currentUser?.role;
    return {
      // Send friend requests: alumni & student
      canSendFriendRequests: role === 'alumni' || role === 'student',
      // Follow users: alumni, student, admin, superadmin
      canFollow: role === 'alumni' || role === 'student' || role === 'admin' || role === 'superadmin',
      // Create events: admin, superadmin, registrar, staff, moderator, faculty
      canCreateEvents: ['admin', 'superadmin', 'registrar', 'staff', 'moderator', 'faculty'].includes(role || ''),
      // Post announcements: admin, superadmin, registrar, staff, moderator, faculty
      canPostAnnouncements: ['admin', 'superadmin', 'registrar', 'staff', 'moderator', 'faculty'].includes(role || ''),
      // Delete events/comments: admin, superadmin, registrar, staff, moderator
      canDeleteEventsComments: ['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(role || ''),
      // Access admin panel: admin, superadmin, registrar, staff, moderator
      canAccessAdminPanel: ['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(role || ''),
      // Access employer dashboard: employer or admin
      canAccessEmployerDashboard: role === 'employer' || ['admin', 'superadmin'].includes(role || ''),
      // Message anyone: Verified alumni, verified employers, admin/staff
      canMessageAnyone: Boolean(currentUser) && (Boolean(currentUser?.isVerified) || ['admin', 'superadmin', 'staff', 'registrar'].includes(role || '')),
      // Campus & Heritage Gallery: admin, superadmin, registrar
      canUploadGallery: ['admin', 'superadmin', 'registrar'].includes(role || ''),
      // Manage Job Moderation & Approval: admin, superadmin, registrar, moderator
      canManageJobModeration: ['admin', 'superadmin', 'registrar', 'moderator'].includes(role || ''),
      // Post Jobs: admin/registrar, OR verified employer with canPostJobs !== false, OR verified alumni
      canPostJobs: ['admin', 'superadmin', 'registrar'].includes(role || '') ||
        (role === 'employer' && Boolean(currentUser?.isVerified) && currentUser?.canPostJobs !== false) ||
        (role === 'alumni' && Boolean(currentUser?.isVerified)),

      // SPECIFIC RBAC RESTRICTIONS:
      // Staff role explicitly DOES NOT have access to registry, conflict resolution, employer accreditation, audit trails, automations, or growth analytics
      canAccessRegistry: ['admin', 'superadmin', 'registrar'].includes(role || ''),
      canAccessConflictResolution: ['admin', 'superadmin', 'registrar'].includes(role || ''),
      canAccessEmployerAccreditation: ['admin', 'superadmin'].includes(role || ''),
      canAccessAuditTrails: ['admin', 'superadmin'].includes(role || ''),
      canAccessAutomations: ['admin', 'superadmin'].includes(role || ''),
      canAccessGrowthAnalytics: ['admin', 'superadmin'].includes(role || ''),

      // Administration & Chapters
      // Assigned roles are immutable across the system - cannot be modified even by administrators
      canAssignRoles: false,
      canVerifyAlumni: ['admin', 'superadmin', 'registrar'].includes(role || ''),
      canManageChapters: ['admin', 'superadmin', 'staff'].includes(role || '')
    };
  }, [currentUser]);

  // Following & Connection list for current user
  const followingIds = useMemo(() => {
    if (!currentUserId) return [];
    return followingMap[currentUserId] || [];
  }, [currentUserId, followingMap]);

  const connectionIds = useMemo(() => {
    if (!currentUserId) return [];
    return connectionsMap[currentUserId] || [];
  }, [currentUserId, connectionsMap]);

  // Unread notifications count
  const unreadNotificationsCount = useMemo(() => {
    if (!currentUserId) return 0;
    return notifications.filter((n) => n.toUid === currentUserId && !n.read).length;
  }, [currentUserId, notifications]);

  // Auth Operations
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const res = await signInWithGoogle();
      const fbUser = res.user;
      if (!fbUser) return false;

      let matched = users.find(
        (u) => u.uid === fbUser.uid || (fbUser.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
      );

      if (!matched) {
        matched = (await getUserFromFirestore(fbUser.uid)) || undefined;
      }

      if (matched) {
        setCurrentUserId(matched.uid);
        await saveUserToFirestore(matched).catch(() => {});
        if (['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(matched.role)) {
          setActiveTab('admin');
        } else {
          setActiveTab('dashboard');
        }
        showToast(`Welcome back, ${matched.name}! Signed in via Google.`);
        return true;
      } else {
        const email = fbUser.email || '';
        const role: UserRole = email.includes('admin') || email.includes('superadmin')
          ? 'admin'
          : email.includes('registrar')
          ? 'registrar'
          : 'alumni';

        const newProfile: UserProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0] || 'Cecilian Member',
          email,
          role,
          batch: role === 'alumni' ? '2024' : 'N/A',
          course: role === 'alumni' ? 'B.S. Information Technology' : 'Institutional Leadership',
          location: 'Cebu, Philippines',
          profilePictureUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
          headline: `${role === 'alumni' ? 'B.S. Information Technology Graduate' : role.toUpperCase() + ' Specialist'} • St. Cecilia’s College`,
          about: 'Member of St. Cecilia’s College Alumni Community connected with Google Authentication.',
          phone: '',
          isVerified: true,
          followersCount: 0,
          followingCount: 0,
          connectionsCount: 0,
          experience: [],
          education: [],
          createdAt: new Date().toISOString(),
          authProvider: 'google'
        };

        setUsers((prev) => [newProfile, ...prev]);
        setCurrentUserId(newProfile.uid);
        await saveUserToFirestore(newProfile).catch(() => {});

        if (['admin', 'superadmin', 'registrar', 'staff', 'moderator'].includes(role)) {
          setActiveTab('admin');
        } else {
          setActiveTab('dashboard');
        }
        showToast(`Welcome, ${newProfile.name}! Account linked with Google.`);
        return true;
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast(err?.message || 'Google sign-in could not be completed.');
      }
      return false;
    }
  };

  // Core Registrar Verification Check
  const registrar_verification = useCallback(
    (studentIdToCheck?: string, candidateName?: string): RegistrarVerificationResult => {
      const rawId = (studentIdToCheck || currentUser?.studentId || '').trim();

      if (!rawId) {
        return {
          isVerified: false,
          status: 'format_error',
          studentId: 'None',
          message: "Student ID 'None' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192)."
        };
      }

      // Check pattern requirement: SCC-YYYY-XXXX (e.g. SCC-2020-0192)
      if (!isValidStudentIdPattern(rawId)) {
        return {
          isVerified: false,
          status: 'format_error',
          studentId: rawId,
          message: `Student ID '${rawId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`
        };
      }

      const normalized = normalizeStudentId(rawId).toUpperCase();
      const registryRecords = getRegistrarRecords();
      const match = registryRecords.find(
        (r) => normalizeStudentId(r.studentId).toUpperCase() === normalized
      );

      if (match) {
        const isUnverifiedRecord =
          (match.status as string)?.toLowerCase() === 'unverified' ||
          match.verification_status === 'unverified';

        if (isUnverifiedRecord) {
          return {
            isVerified: false,
            status: 'not_found',
            studentId: rawId,
            message: `Student ID '${rawId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`
          };
        }

        if (candidateName && candidateName.trim().length >= 2) {
          const qNorm = candidateName.trim().toLowerCase();
          const rNorm = (match.fullName || '').trim().toLowerCase();
          const qParts = qNorm.split(' ').filter((p) => p.length >= 2);
          const nameMatches =
            rNorm === qNorm ||
            rNorm.includes(qNorm) ||
            qNorm.includes(rNorm) ||
            qParts.some((p) => rNorm.includes(p));

          if (!nameMatches) {
            return {
              isVerified: false,
              status: 'not_found',
              studentId: rawId,
              message: 'Security Verification Failed: The student name provided does not match the official registrar record for this Student ID. Details on file cannot be disclosed for identity protection.'
            };
          }
        }

        return {
          isVerified: true,
          status: 'verified',
          studentId: normalized,
          record: match,
          message: 'Academic Record Confirmed! Official graduate record verified.'
        };
      }

      return {
        isVerified: false,
        status: 'not_found',
        studentId: rawId,
        message: `Student ID '${rawId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`
      };
    },
    [currentUser]
  );

  const login = (identifier: string, pass: string): boolean => {
    const trimmed = identifier.trim().toLowerCase();
    const normalizedInputId = normalizeStudentId(trimmed).toLowerCase();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        (trimmed === 'juan@email.com' && u.email === 'alumni@stcecilia.edu') ||
        (u.studentId && (
          u.studentId.toLowerCase() === trimmed ||
          normalizeStudentId(u.studentId).toLowerCase() === normalizedInputId
        )) ||
        (u.employeeId && (
          u.employeeId.toLowerCase() === trimmed ||
          u.employeeId.toLowerCase() === `scc-${trimmed}` ||
          trimmed.replace(/^scc-/i, '') === u.employeeId.toLowerCase().replace(/^scc-/i, '')
        ))
    );
    if (user) {
      if (user.password && pass && user.password !== pass) {
        showToast('Incorrect password entered.');
        return false;
      }
      setCurrentUserId(user.uid);
      saveUserToFirestore(user).catch(() => {});
      if (['admin', 'registrar', 'staff', 'moderator'].includes(user.role)) {
        setActiveTab('admin');
      } else {
        setActiveTab('dashboard');
      }
      showToast(`Welcome back, ${user.name}!`);
      return true;
    }
    showToast('Invalid credentials. Check your email or Student ID.');
    return false;
  };

  const register = (data: Partial<UserProfile> & { password?: string }): boolean => {
    const newUid = `user_${Date.now()}`;
    // Admin accounts cannot be created by public registration (admin account created by admin only)
    let role = data.role || 'alumni';
    if (role === 'admin') {
      showToast('Admin accounts cannot be registered publicly. Provisioned as Alumni.');
      role = 'alumni';
    }

    // Check if email already exists
    if (data.email && users.some((u) => u.email.toLowerCase() === data.email!.toLowerCase())) {
      showToast('An account with this email already exists.', 'error');
      return false;
    }

    // Strict registrar verification check for student/alumni accounts
    let verifiedRegistrarRecord: any = null;
    if (role === 'alumni') {
      const rawStudentId = (data.studentId || '').trim();

      // Specifically reject accounts if Student ID is missing or does not match expected format SCC-YYYY-XXXX
      if (!rawStudentId || !isValidStudentIdPattern(rawStudentId)) {
        showToast(
          `Student ID '${rawStudentId || 'None'}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`,
          'error'
        );
        return false;
      }

      // Strictly verify academic record against official registrar records
      const verification = registrar_verification(rawStudentId, data.name);
      if (!verification.isVerified || !verification.record) {
        showToast(
          verification.message ||
            `Student ID '${rawStudentId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2024-0001 or SCC-2020-0192).`,
          'error'
        );
        return false;
      }

      // Reject if student ID is already claimed by another active profile
      const alreadyClaimed = users.some(
        (u) =>
          u.studentId &&
          normalizeStudentId(u.studentId).toUpperCase() === normalizeStudentId(rawStudentId).toUpperCase()
      );
      if (alreadyClaimed) {
        showToast(
          `Student ID '${rawStudentId}' is already registered with an active alumni profile. Please sign in or contact the Registrar.`,
          'error'
        );
        return false;
      }

      verifiedRegistrarRecord = verification.record;
    }

    const finalStudentId = verifiedRegistrarRecord?.studentId || data.studentId;
    const finalBatch = verifiedRegistrarRecord?.batchYear || data.batch || (role === 'alumni' ? '2024' : 'N/A');
    const finalCourse =
      verifiedRegistrarRecord?.course ||
      data.course ||
      (role === 'alumni' ? 'B.S. Information Technology' : role === 'employer' ? 'Corporate Industry Partner' : 'Campus Administration & Services');
    const finalName = data.name || verifiedRegistrarRecord?.fullName || (role === 'employer' ? data.companyName || 'Corporate Partner' : 'Juan Dela Cruz');

    const newUser: UserProfile = {
      uid: newUid,
      name: finalName,
      email: data.email || `${role === 'employer' ? 'careers' : 'alumni'}_${Date.now()}@stcecilia.edu`,
      password: data.password || 'Password123!',
      role,
      batch: finalBatch,
      course: finalCourse,
      location: data.location || (role === 'employer' ? 'Cebu City, Philippines' : 'Cebu, Philippines'),
      alumniId: data.alumniId || (role === 'alumni' ? generateAlumniId(finalBatch, finalStudentId, newUid) : undefined),
      studentId: finalStudentId,
      employeeId: data.employeeId,
      department: data.department,
      companyName: data.companyName,
      companyIndustry: data.companyIndustry,
      companyWebsite: data.companyWebsite,
      companyAddress: data.companyAddress,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      employerVerificationStatus: role === 'employer' ? 'pending_verification' : undefined,
      verificationStatus: role === 'alumni' ? 'verified' : role === 'employer' ? 'pending_review' : 'verified',
      profilePictureUrl: data.profilePictureUrl || (role === 'employer' ? 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=400&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'),
      coverPhotoUrl: data.coverPhotoUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
      headline: data.headline || (role === 'employer' ? `Hiring Partner • ${data.companyName || 'Corporate Partner'}` : `${role === 'alumni' ? (finalCourse || 'Alumni') + ' Graduate' : role.toUpperCase() + ' Specialist'} • St. Cecilia’s College`),
      about: data.about || (role === 'employer' ? `Official employer and industry partner recruiting talented graduates of St. Cecilia’s College.` : 'Excited to be part of the St. Cecilia’s College alumni and institutional community.'),
      phone: data.phone || data.contactPhone || '+63 917 123 4567',
      isVerified: role === 'alumni' ? true : role === 'employer' ? false : (data.isVerified ?? false),
      verified: role === 'alumni' ? true : role === 'employer' ? false : (data.verified ?? false),
      followersCount: 0,
      followingCount: 0,
      connectionsCount: 0,
      experience: [],
      education: role === 'employer' ? [] : [
        {
          id: `edu_${Date.now()}`,
          degree: finalCourse || 'Bachelor Degree Program',
          institution: 'St. Cecilia’s College',
          fieldOfStudy: finalCourse || 'Information Technology',
          startYear: String(new Date().getFullYear() - 4),
          endYear: String(new Date().getFullYear())
        }
      ],
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUserId(newUid);
    alumniService.createAlumni(newUser).catch((err) => {
      console.warn('Error saving new user to Firestore:', err);
    });

    if (role === 'alumni' && newUser.studentId) {
      markRegistryRecordAsRegistered(newUser.studentId, newUid);
    }

    if (role === 'employer') {
      // Notify admins that employer registered and requires verification
      const adminNotif: AppNotification = {
        id: `notif_emp_reg_${Date.now()}`,
        type: 'general',
        title: '🏢 New Employer Partner Registered',
        body: `${newUser.companyName || newUser.name} has registered and submitted an accreditation request for Admin Verification.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [adminNotif, ...prev]);
      showToast(`Company registered! Status: Pending Admin Verification.`, 'info');
    } else {
      showToast(`Account registered and verified with official registrar records! Welcome, ${newUser.name}!`, 'success');
    }
    return true;
  };

  // Administrator-exclusive account creation (admin accounts created by admin only)
  const createUserByAdmin = (data: Partial<UserProfile> & { password?: string; role: UserRole }): boolean => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
      showToast('Permission denied: Only system Administrators can provision staff and admin accounts.');
      return false;
    }
    const newUid = `user_admin_${Date.now()}`;
    const role = data.role || 'alumni';
    const newUser: UserProfile = {
      uid: newUid,
      name: data.name || 'New University User',
      email: data.email || `account_${Date.now()}@stcecilia.edu`,
      password: data.password || 'Password123!',
      role,
      batch: data.batch || (role === 'alumni' ? '2024' : 'N/A'),
      course: data.course || (role === 'alumni' ? 'B.S. Information Technology' : 'Campus Administration & Services'),
      location: data.location || 'St. Cecilia’s Campus',
      studentId: data.studentId,
      employeeId: data.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
      department: data.department || (role === 'admin' ? 'Institutional Advancement' : 'Academic Affairs'),
      profilePictureUrl: data.profilePictureUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      coverPhotoUrl: data.coverPhotoUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
      headline: data.headline || `${role.toUpperCase()} • St. Cecilia’s College`,
      about: data.about || `Official ${role} profile created by Administrator.`,
      phone: data.phone || '+63 918 000 0000',
      isVerified: true,
      followersCount: 0,
      followingCount: 0,
      connectionsCount: 0,
      experience: [],
      education: [],
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [newUser, ...prev]);
    alumniService.createAlumni(newUser).catch((err) => {
      console.warn('Error saving admin-created alumni to Firestore:', err);
    });
    showToast(`Account for ${newUser.name} provisioned as ${newUser.role.toUpperCase()}!`);
    return true;
  };

  // Campus & Heritage Gallery: Admin and Registrar can upload
  const addGalleryItem = (item: Omit<GalleryItem, 'id' | 'createdAt'>): boolean => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'registrar' && currentUser?.role !== 'superadmin') {
      showToast('Permission denied: Only Admin and Registrar can upload to Campus & Heritage Gallery.');
      return false;
    }
    const newItem: GalleryItem = {
      ...item,
      id: `gal_${Date.now()}`,
      uploadedBy: currentUser.uid,
      uploadedByName: currentUser.name,
      uploaderRole: currentUser.role,
      createdAt: new Date().toISOString()
    };
    setGalleryItems((prev) => [newItem, ...prev]);
    showToast(`New photo "${newItem.title}" added to Campus & Heritage Gallery!`);
    return true;
  };

  const deleteGalleryItem = (id: string): boolean => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'registrar' && currentUser?.role !== 'superadmin') {
      showToast('Permission denied: Only Admin and Registrar can manage gallery items.');
      return false;
    }
    setGalleryItems((prev) => prev.filter((g) => g.id !== id));
    showToast('Photo removed from Campus & Heritage Gallery.');
    return true;
  };

  const logout = () => {
    signOutUser().catch(() => {});
    setCurrentUserId(null);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    showToast('Logged out successfully.');
  };

  const switchUser = (uid: string) => {
    const target = users.find((u) => u.uid === uid);
    if (target) {
      setCurrentUserId(uid);
      showToast(`Switched view to ${target.name} (${target.role.toUpperCase()})`);
    }
  };

  const resetPassword = (email: string): boolean => {
    showToast(`Password reset link sent to ${email}. Check your inbox.`);
    return true;
  };

  const resetUserPasswordByEmail = (email: string, newPass: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    const targetUser = users.find((u) => u.email.toLowerCase() === trimmed);
    if (!targetUser) {
      showToast('No registered account found with that email address.');
      return false;
    }
    setUsers((prev) =>
      prev.map((u) => (u.email.toLowerCase() === trimmed ? { ...u, password: newPass } : u))
    );
    alumniService.updateAlumni(targetUser.uid, { password: newPass }).catch((err) => {
      console.warn('Error updating password in Firestore:', err);
    });
    showToast('Password updated securely. You can now sign in with your new password.');
    return true;
  };

  const deleteAccount = (): boolean => {
    if (!currentUserId) return false;
    const uidToDelete = currentUserId;
    setUsers((prev) => prev.filter((u) => u.uid !== uidToDelete));
    alumniService.deleteAlumni(uidToDelete).catch((err) => {
      console.warn('Error deleting user account from Firestore:', err);
    });
    setCurrentUserId(null);
    showToast('Account permanently deleted.');
    return true;
  };

  const changeEmail = (newEmail: string): boolean => {
    if (!currentUserId) return false;
    setUsers((prev) =>
      prev.map((u) => (u.uid === currentUserId ? { ...u, email: newEmail } : u))
    );
    alumniService.updateAlumni(currentUserId, { email: newEmail }).catch((err) => {
      console.warn('Error updating email in Firestore:', err);
    });
    showToast(`Email updated to ${newEmail}. Verification link dispatched.`);
    return true;
  };

  const changePassword = (newPass: string): boolean => {
    if (!currentUserId) return false;
    setUsers((prev) =>
      prev.map((u) => (u.uid === currentUserId ? { ...u, password: newPass } : u))
    );
    alumniService.updateAlumni(currentUserId, { password: newPass }).catch((err) => {
      console.warn('Error updating password in Firestore:', err);
    });
    showToast('Password updated securely.');
    return true;
  };

  // Profile operations
  const updateProfile = (data: Partial<UserProfile>) => {
    if (!currentUserId) {
      showToast('You must be signed in to update your profile.', 'error');
      return;
    }
    setUsers((prev) => {
      const updated = prev.map((u) => (u.uid === currentUserId ? { ...u, ...data } : u));
      return updated;
    });
    alumniService
      .updateAlumni(currentUserId, data)
      .then(() => {
        showToast('Profile updated successfully!', 'success');
      })
      .catch((err) => {
        console.warn('Error updating profile in Firestore:', err);
        showToast('Failed to save profile changes to Firestore. Please try again.', 'error');
      });
  };

  const addExperience = (exp: Omit<Experience, 'id'>) => {
    if (!currentUserId) return;
    const newExp: Experience = {
      id: `exp_${Date.now()}`,
      ...exp
    };
    const targetUser = users.find((u) => u.uid === currentUserId);
    const updatedExperience = [newExp, ...(targetUser?.experience || [])];
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUserId
          ? { ...u, experience: updatedExperience }
          : u
      )
    );
    alumniService.updateAlumni(currentUserId, { experience: updatedExperience }).catch((err) => {
      console.warn('Error saving experience to Firestore:', err);
    });
    showToast('New work experience added!');
  };

  const removeExperience = (id: string) => {
    if (!currentUserId) return;
    const targetUser = users.find((u) => u.uid === currentUserId);
    const updatedExperience = (targetUser?.experience || []).filter((e) => e.id !== id);
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUserId
          ? { ...u, experience: updatedExperience }
          : u
      )
    );
    alumniService.updateAlumni(currentUserId, { experience: updatedExperience }).catch((err) => {
      console.warn('Error updating experience in Firestore:', err);
    });
    showToast('Experience removed.');
  };

  const addEducation = (edu: Omit<Education, 'id'>) => {
    if (!currentUserId) return;
    const newEdu: Education = {
      id: `edu_${Date.now()}`,
      ...edu
    };
    const targetUser = users.find((u) => u.uid === currentUserId);
    const updatedEducation = [newEdu, ...(targetUser?.education || [])];
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUserId
          ? { ...u, education: updatedEducation }
          : u
      )
    );
    alumniService.updateAlumni(currentUserId, { education: updatedEducation }).catch((err) => {
      console.warn('Error saving education to Firestore:', err);
    });
    showToast('Education milestone added!');
  };

  const removeEducation = (id: string) => {
    if (!currentUserId) return;
    const targetUser = users.find((u) => u.uid === currentUserId);
    const updatedEducation = (targetUser?.education || []).filter((e) => e.id !== id);
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUserId
          ? { ...u, education: updatedEducation }
          : u
      )
    );
    alumniService.updateAlumni(currentUserId, { education: updatedEducation }).catch((err) => {
      console.warn('Error updating education in Firestore:', err);
    });
    showToast('Education removed.');
  };

  // Friends & Network operations
  const isFollowing = (uid: string) => {
    if (!currentUserId) return false;
    return (followingMap[currentUserId] || []).includes(uid);
  };

  const isConnected = (uid: string) => {
    if (!currentUserId) return false;
    return (connectionsMap[currentUserId] || []).includes(uid);
  };

  const hasPendingRequestWith = (uid: string): 'sent' | 'received' | false => {
    if (!currentUserId) return false;
    const req = friendRequests.find(
      (r) =>
        r.status === 'pending' &&
        ((r.fromUid === currentUserId && r.toUid === uid) ||
          (r.fromUid === uid && r.toUid === currentUserId))
    );
    if (!req) return false;
    return req.fromUid === currentUserId ? 'sent' : 'received';
  };

  const sendFriendRequest = (targetUid: string) => {
    if (!currentUser) {
      showToast('Please sign in to send connection requests.', 'error');
      return { success: false, error: 'Not authenticated' };
    }

    if (currentUser.uid === targetUid) {
      showToast('You cannot send a connection request to yourself.', 'warning');
      return { success: false, error: 'Self connection' };
    }

    const targetUser = users.find((u) => u.uid === targetUid);
    if (!targetUser) {
      showToast('Target alumnus profile not found.', 'error');
      return { success: false, error: 'Target user not found' };
    }

    if (isConnected(targetUid)) {
      showToast(`You are already connected with ${targetUser.name}.`, 'info');
      return { success: false, error: 'Already connected' };
    }

    const existingReq = friendRequests.find(
      (r) =>
        r.status === 'pending' &&
        ((r.fromUid === currentUser.uid && r.toUid === targetUid) ||
          (r.fromUid === targetUid && r.toUid === currentUser.uid))
    );
    if (existingReq) {
      showToast('A pending connection request already exists.', 'warning');
      return { success: false, error: 'Request exists' };
    }

    const newReqId = `req_${currentUser.uid}_${targetUid}_${Date.now()}`;
    const newReq: FriendRequest = {
      id: newReqId,
      fromUid: currentUser.uid,
      toUid: targetUid,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setFriendRequests((prev) => [newReq, ...prev]);
    saveFriendRequestToFirestore(newReq).catch(() => {});

    // Create Notification for receiver
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      toUid: targetUid,
      fromUid: currentUser.uid,
      type: 'friend_request',
      title: 'New Connection Request',
      body: `${currentUser.name} (${currentUser.course || 'Alumni'}, Batch ${currentUser.batch || 'Class'}) sent you a connection request.`,
      refId: newReq.id,
      actionStatus: 'pending',
      read: false,
      createdAt: new Date().toISOString()
    };

    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif).catch(() => {});
    showToast(`Connection request sent to ${targetUser.name}!`, 'success');

    return { success: true };
  };

  const acceptFriendRequest = (requestId: string) => {
    const req = friendRequests.find((r) => r.id === requestId);
    if (!req || !currentUser) return;

    const updatedReq = { ...req, status: 'accepted' as const };
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? updatedReq : r))
    );
    saveFriendRequestToFirestore(updatedReq).catch(() => {});

    // Update bidirectional connections
    setConnectionsMap((prev) => {
      const currentCons = prev[currentUser.uid] || [];
      const senderCons = prev[req.fromUid] || [];
      return {
        ...prev,
        [currentUser.uid]: Array.from(new Set([...currentCons, req.fromUid])),
        [req.fromUid]: Array.from(new Set([...senderCons, currentUser.uid]))
      };
    });

    // Persist accepted connection to Firestore connections collection
    const connId = [currentUser.uid, req.fromUid].sort().join('_');
    const nowIso = new Date().toISOString();
    saveConnectionToFirestore({
      id: connId,
      userId: currentUser.uid,
      connectedUserId: req.fromUid,
      participants: [currentUser.uid, req.fromUid],
      status: 'accepted',
      createdAt: nowIso,
      updatedAt: nowIso
    }).catch((err) => {
      console.warn('Error saving connection to Firestore:', err);
    });

    // Increment connection counts
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === currentUser.uid || u.uid === req.fromUid) {
          return { ...u, connectionsCount: (u.connectionsCount || 0) + 1 };
        }
        return u;
      })
    );

    const sender = users.find((u) => u.uid === req.fromUid);

    // Update the receiving notification status to 'accepted' so buttons are removed
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.refId === requestId || (n.type === 'friend_request' && n.fromUid === req.fromUid && n.toUid === currentUser.uid)) {
          const updated: AppNotification = {
            ...n,
            actionStatus: 'accepted',
            read: true,
            body: `You accepted ${sender?.name || 'alumnus'}'s connection request.`
          };
          saveNotificationToFirestore(updated).catch(() => {});
          return updated;
        }
        return n;
      })
    );

    // Notification to sender
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      toUid: req.fromUid,
      fromUid: currentUser.uid,
      type: 'friend_accepted',
      title: 'Connection Accepted',
      body: `${currentUser.name} accepted your alumni connection request.`,
      refId: currentUser.uid,
      actionStatus: 'accepted',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif).catch(() => {});

    showToast(`You are now connected with ${sender ? sender.name : 'your fellow alumnus'}!`, 'success');
  };

  const declineFriendRequest = (requestId: string) => {
    const req = friendRequests.find((r) => r.id === requestId);
    if (!req || !currentUser) return;

    const updatedReq = { ...req, status: 'declined' as const };
    saveFriendRequestToFirestore(updatedReq).catch(() => {});
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? updatedReq : r))
    );

    // Update receiving notification so buttons are removed
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.refId === requestId || (n.type === 'friend_request' && n.fromUid === req.fromUid && n.toUid === currentUser.uid)) {
          const updated: AppNotification = {
            ...n,
            actionStatus: 'declined',
            read: true,
            body: 'Connection request was declined.'
          };
          saveNotificationToFirestore(updated).catch(() => {});
          return updated;
        }
        return n;
      })
    );

    showToast('Connection request declined.', 'info');
  };

  const cancelFriendRequest = (requestId: string) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    deleteFriendRequestFromFirestore(requestId).catch(() => {});
    showToast('Connection request cancelled.');
  };

  const toggleFollow = (targetUid: string) => {
    if (!currentUser) return;
    if (!permissions.canFollow) {
      showToast('Only Alumni and Admins can follow users.');
      return;
    }

    const currentFollowing = followingMap[currentUser.uid] || [];
    const isNowFollowing = currentFollowing.includes(targetUid);

    setFollowingMap((prev) => {
      const updated = isNowFollowing
        ? currentFollowing.filter((id) => id !== targetUid)
        : [...currentFollowing, targetUid];
      return { ...prev, [currentUser.uid]: updated };
    });

    // Update follower/following counts
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === currentUser.uid) {
          return {
            ...u,
            followingCount: Math.max(0, (u.followingCount || 0) + (isNowFollowing ? -1 : 1))
          };
        }
        if (u.uid === targetUid) {
          return {
            ...u,
            followersCount: Math.max(0, (u.followersCount || 0) + (isNowFollowing ? -1 : 1))
          };
        }
        return u;
      })
    );

    const target = users.find((u) => u.uid === targetUid);
    showToast(isNowFollowing ? `Unfollowed ${target?.name}` : `Following ${target?.name}`);
  };

  // Messaging operations
  const getOrCreateChat = (targetUid: string): string => {
    if (!currentUser) return '';
    const existingChat = chats.find(
      (c) => c.memberIds.includes(currentUser.uid) && c.memberIds.includes(targetUid)
    );
    if (existingChat) {
      setActiveChatId(existingChat.id);
      return existingChat.id;
    }

    // Create new chat
    const newChatId = `chat_${Date.now()}`;
    const newChat: ChatThread = {
      id: newChatId,
      memberIds: [currentUser.uid, targetUid],
      lastMessage: 'Conversation started',
      lastMessageAt: new Date().toISOString(),
      unreadCount: {
        [currentUser.uid]: 0,
        [targetUid]: 0
      }
    };

    setChats((prev) => [newChat, ...prev]);
    setMessages((prev) => ({ ...prev, [newChatId]: [] }));
    setActiveChatId(newChatId);
    saveChatToFirestore(newChat).catch(() => {});
    return newChatId;
  };

  const sendMessage = (chatId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const now = new Date().toISOString();

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderAvatar: currentUser.profilePictureUrl,
      senderRole: currentUser.role,
      text: text.trim(),
      createdAt: now
    };

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg]
    }));

    saveChatMessageToFirestore(chatId, newMsg).catch(() => {});

    let updatedChatObj: ChatThread | undefined;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const nextUnread = { ...c.unreadCount };
          // Increment unread count for all other members in group or 1-on-1 chat
          (c.memberIds || []).forEach((mId) => {
            if (mId !== currentUser.uid) {
              nextUnread[mId] = (nextUnread[mId] || 0) + 1;
            }
          });
          updatedChatObj = {
            ...c,
            lastMessage: text.trim(),
            lastMessageAt: now,
            unreadCount: nextUnread
          };
          return updatedChatObj;
        }
        return c;
      })
    );

    if (updatedChatObj) {
      saveChatToFirestore(updatedChatObj).catch(() => {});
    }
  };

  const markChatAsRead = (chatId: string) => {
    if (!currentUser) return;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            unreadCount: {
              ...c.unreadCount,
              [currentUser.uid]: 0
            }
          };
        }
        return c;
      })
    );
  };

  // Events operations
  const createEvent = (
    eventData: Omit<AlumniEvent, 'id' | 'likes' | 'comments' | 'attendeesCount' | 'createdBy' | 'createdByName'>
  ) => {
    if (!currentUser || !permissions.canCreateEvents) {
      showToast('Permission denied: Only staff and admin roles can create events.');
      return;
    }

    const newEvtId = `evt_${Date.now()}`;
    const eventChatId = `chat_event_${newEvtId}`;

    // Step 2: System automatically creates a group chat with the event name
    const eventGroupChat: ChatThread = {
      id: eventChatId,
      memberIds: [currentUser.uid],
      lastMessage: `Official event group chat created for "${eventData.title}". Attendees will be automatically added when they RSVP.`,
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [currentUser.uid]: 0 },
      isGroupChat: true,
      groupName: `${eventData.title} – Group Chat`,
      groupDescription: `Official coordination chat for ${eventData.title}. Organized by ${currentUser.name}.`,
      eventId: newEvtId,
      isEventChat: true,
      adminUids: [currentUser.uid]
    };

    const newEvt: AlumniEvent = {
      id: newEvtId,
      ...eventData,
      groupChatId: eventChatId,
      likes: [],
      comments: [],
      attendeesCount: 1,
      createdBy: currentUser.uid,
      createdByName: `${currentUser.name} (${currentUser.role.toUpperCase()})`,
      attendees: [
        {
          uid: currentUser.uid,
          name: currentUser.name,
          avatar: currentUser.profilePictureUrl,
          role: currentUser.role,
          status: 'going',
          rsvpDate: new Date().toISOString()
        }
      ]
    };

    // System welcome message for the event group chat
    const initialWelcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}_sys_init`,
      chatId: eventChatId,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderAvatar: currentUser.profilePictureUrl,
      senderRole: currentUser.role,
      text: `Welcome to the official group chat for "${eventData.title}"! All alumni and guests who RSVP will be automatically added to this conversation.`,
      createdAt: new Date().toISOString(),
      isSystemMessage: true
    };

    setChats((prev) => [eventGroupChat, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [eventChatId]: [initialWelcomeMessage]
    }));
    saveChatToFirestore(eventGroupChat).catch(() => {});
    saveChatMessageToFirestore(eventChatId, initialWelcomeMessage).catch(() => {});

    setEvents((prev) => [newEvt, ...prev]);
    saveEventToFirestore(newEvt).catch((err) => {
      console.warn('Failed to persist new event in Firestore:', err);
    });

    addAuditLog({
      action: 'Event & Group Chat Provisioned',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'communication',
      details: `Created event "${newEvt.title}" and initialized official attendee group chat "${eventGroupChat.groupName}".`,
      severity: 'info'
    });

    // Broadcast notification to other users
    const broadcastNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      toUid: 'all',
      type: 'event_broadcast',
      title: `New Event: ${newEvt.title}`,
      body: `Organized by ${currentUser.name}. ${newEvt.isVirtual ? 'Virtual event' : newEvt.location}. RSVP now to join the official event group chat!`,
      refId: newEvt.id,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [broadcastNotif, ...prev]);
    showToast(`Event published and group chat "${eventGroupChat.groupName}" created!`);
  };

  const editEvent = (eventId: string, data: Partial<AlumniEvent>) => {
    if (!permissions.canCreateEvents) {
      showToast('Permission denied: Only staff and admin roles can edit events.');
      return;
    }
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const updated = { ...e, ...data };
          saveEventToFirestore(updated).catch((err) => {
            console.warn('Failed to update event in Firestore:', err);
          });
          return updated;
        }
        return e;
      })
    );
    showToast('Event details updated.');
  };

  const addAuditLog = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    saveAuditLogToFirestore(newLog).catch(() => {});
  }, []);

  const deleteEvent = (eventId: string) => {
    if (!permissions.canDeleteEventsComments) {
      showToast('Permission denied: Staff/Admin authorization required.');
      return;
    }
    const target = events.find((e) => e.id === eventId);
    if (target) {
      // Event Cancellation Notification dispatched to attendees
      if (target.attendees && target.attendees.length > 0) {
        const cancelNotif: AppNotification = {
          id: `notif_evt_cancel_${Date.now()}`,
          type: 'event',
          title: 'Event Cancellation Notice',
          body: `Notice: "${target.title}" originally scheduled on ${new Date(target.startDate).toLocaleDateString()} has been cancelled by the administration.`,
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications((prev) => [cancelNotif, ...prev]);
      }

      addAuditLog({
        action: 'Event Deleted / Cancelled',
        actorId: currentUser?.uid || 'admin',
        actorName: currentUser?.name || 'Administrator',
        actorRole: currentUser?.role || 'admin',
        category: 'admin',
        details: `Event "${target.title}" was removed from the institutional calendar.`,
        severity: 'warning'
      });
    }

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    deleteEventFromFirestore(eventId).catch((err) => {
      console.warn('Failed to delete event from Firestore:', err);
    });
    showToast('Event deleted.');
  };

  const toggleLikeEvent = (eventId: string) => {
    if (!currentUser) return;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const liked = e.likes.includes(currentUser.uid);
          const updated = {
            ...e,
            likes: liked
              ? e.likes.filter((id) => id !== currentUser.uid)
              : [...e.likes, currentUser.uid]
          };
          saveEventToFirestore(updated).catch(() => {});
          return updated;
        }
        return e;
      })
    );
  };

  const addCommentToEvent = (eventId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const newComment = {
      id: `c_${Date.now()}`,
      eventId,
      authorId: currentUser.uid,
      authorName: currentUser.name,
      authorAvatar: currentUser.profilePictureUrl,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const updated = {
            ...e,
            comments: [...e.comments, newComment]
          };
          saveEventToFirestore(updated).catch(() => {});
          return updated;
        }
        return e;
      })
    );
    showToast('Comment posted.');
  };

  const rsvpEvent = (eventId: string, status: 'going' | 'interested' | 'not_going') => {
    if (!currentUser) {
      showToast('Please sign in to RSVP for events.', 'error');
      return;
    }
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    // Toggle logic: if user clicks the currently active status, toggle back to 'not_going'
    const newStatus = targetEvent.userRsvp === status ? 'not_going' : status;
    const wasGoing = targetEvent.userRsvp === 'going';
    const isNowGoing = newStatus === 'going';
    let delta = 0;
    if (!wasGoing && isNowGoing) delta = 1;
    if (wasGoing && !isNowGoing) delta = -1;

    // Update dynamic attendees array
    const existingAttendees = targetEvent.attendees || [];
    let updatedAttendees: EventAttendee[];
    if (newStatus === 'not_going') {
      updatedAttendees = existingAttendees.filter((a) => a.uid !== currentUser.uid);
    } else {
      const attendeeItem: EventAttendee = {
        uid: currentUser.uid,
        name: currentUser.name,
        avatar: currentUser.profilePictureUrl,
        batch: currentUser.batch,
        course: currentUser.course,
        role: currentUser.role,
        status: newStatus,
        rsvpDate: new Date().toISOString()
      };
      const foundIdx = existingAttendees.findIndex((a) => a.uid === currentUser.uid);
      if (foundIdx >= 0) {
        updatedAttendees = [...existingAttendees];
        updatedAttendees[foundIdx] = attendeeItem;
      } else {
        updatedAttendees = [attendeeItem, ...existingAttendees];
      }
    }

    const updatedEvent: AlumniEvent = {
      ...targetEvent,
      userRsvp: newStatus,
      attendees: updatedAttendees,
      attendeesCount: Math.max(0, targetEvent.attendeesCount + delta)
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));

    // Send automated Event Registration Confirmation and schedule 1-day before & event-day reminders
    if (newStatus !== 'not_going') {
      const eventDate = new Date(targetEvent.startDate);
      const eventDateFormatted = isNaN(eventDate.getTime())
        ? targetEvent.startDate
        : eventDate.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
      const eventTimeFormatted = isNaN(eventDate.getTime())
        ? ''
        : eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 1. Immediate RSVP Confirmation
      const confirmNotif: AppNotification = {
        id: `notif_rsvp_${Date.now()}`,
        toUid: currentUser.uid,
        type: 'event',
        title: 'Event Registration Confirmed!',
        body: `You are confirmed as ${newStatus === 'going' ? 'attending' : 'interested in'} "${targetEvent.title}". We have scheduled automated reminders: 1 day prior and on event day.`,
        read: false,
        createdAt: new Date().toISOString(),
        metadata: { eventId: targetEvent.id, rsvpStatus: newStatus }
      };

      // 2. Automated 1-Day Before Event Reminder Notification
      const oneDayBeforeNotif: AppNotification = {
        id: `notif_rsvp_1day_${targetEvent.id}_${currentUser.uid}`,
        toUid: currentUser.uid,
        type: 'event',
        title: `Event Reminder (1 Day Before): ${targetEvent.title}`,
        body: `Tomorrow is the day! "${targetEvent.title}" takes place tomorrow (${eventDateFormatted} ${eventTimeFormatted ? 'at ' + eventTimeFormatted : ''}) at ${targetEvent.location}. Ensure you have your St. Cecilia's College Digital ID ready for campus entry!`,
        read: false,
        createdAt: new Date(Date.now() + 1000).toISOString(),
        metadata: {
          eventId: targetEvent.id,
          reminderType: '1_day_before',
          eventStartDate: targetEvent.startDate,
          location: targetEvent.location
        }
      };

      // 3. Automated Event Day Notification ("when the event comes")
      const eventDayNotif: AppNotification = {
        id: `notif_rsvp_day_${targetEvent.id}_${currentUser.uid}`,
        toUid: currentUser.uid,
        type: 'event',
        title: `Event Today: ${targetEvent.title}`,
        body: `Today is the event! "${targetEvent.title}" takes place today at ${targetEvent.location}. Check in at the entrance using your official SCC Digital Pass.`,
        read: false,
        createdAt: new Date(Date.now() + 2000).toISOString(),
        metadata: {
          eventId: targetEvent.id,
          reminderType: 'event_day',
          eventStartDate: targetEvent.startDate,
          location: targetEvent.location
        }
      };

      setNotifications((prev) => {
        const withoutOldReminders = prev.filter(
          (n) => n.id !== oneDayBeforeNotif.id && n.id !== eventDayNotif.id
        );
        return [confirmNotif, oneDayBeforeNotif, eventDayNotif, ...withoutOldReminders];
      });

      saveNotificationToFirestore(confirmNotif).catch(() => {});
      saveNotificationToFirestore(oneDayBeforeNotif).catch(() => {});
      saveNotificationToFirestore(eventDayNotif).catch(() => {});

      // Step 4: When a user RSVPs, automatically add them to the event's group chat
      const eventChatId = targetEvent.groupChatId || `chat_event_${eventId}`;
      const joinMsg: ChatMessage = {
        id: `msg_${Date.now()}_sys_join`,
        chatId: eventChatId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.profilePictureUrl,
        senderRole: currentUser.role,
        text: `${currentUser.name} joined the event group chat (${newStatus === 'going' ? 'Attending' : 'Interested'}).`,
        createdAt: new Date().toISOString(),
        isSystemMessage: true
      };

      setMessages((prev) => ({
        ...prev,
        [eventChatId]: [...(prev[eventChatId] || []), joinMsg]
      }));
      saveChatMessageToFirestore(eventChatId, joinMsg).catch(() => {});

      setChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex(
          (c) => c.eventId === eventId || c.id === eventChatId
        );
        if (existingChatIndex >= 0) {
          const c = prevChats[existingChatIndex];
          const hasMember = c.memberIds.includes(currentUser.uid);
          const updatedChat: ChatThread = {
            ...c,
            memberIds: hasMember ? c.memberIds : [...c.memberIds, currentUser.uid],
            lastMessage: `${currentUser.name} joined the event group chat (${newStatus === 'going' ? 'Attending' : 'Interested'}).`,
            lastMessageAt: new Date().toISOString()
          };
          saveChatToFirestore(updatedChat).catch(() => {});
          const updated = [...prevChats];
          updated[existingChatIndex] = updatedChat;
          return updated;
        } else {
          // Auto-generate group chat if it didn't already exist
          const newChat: ChatThread = {
            id: eventChatId,
            memberIds: Array.from(new Set([targetEvent.createdBy, currentUser.uid])),
            lastMessage: `${currentUser.name} joined the event group chat (${newStatus === 'going' ? 'Attending' : 'Interested'}).`,
            lastMessageAt: new Date().toISOString(),
            unreadCount: { [currentUser.uid]: 0 },
            isGroupChat: true,
            groupName: `${targetEvent.title} – Group Chat`,
            groupDescription: `Official coordination chat for ${targetEvent.title}.`,
            eventId: eventId,
            isEventChat: true,
            adminUids: [targetEvent.createdBy]
          };
          saveChatToFirestore(newChat).catch(() => {});
          return [newChat, ...prevChats];
        }
      });

      // Group chat confirmation notification
      const groupChatNotif: AppNotification = {
        id: `notif_chat_added_${Date.now()}`,
        toUid: currentUser.uid,
        type: 'message',
        title: 'Added to Event Group Chat',
        body: `You have been automatically added to the official attendee group chat for "${targetEvent.title}". Open Messaging to connect with fellow attendees!`,
        refId: eventChatId,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [groupChatNotif, ...prev]);

      // Notify organizer of new RSVP
      if (targetEvent.createdBy && targetEvent.createdBy !== currentUser.uid) {
        const organizerNotif: AppNotification = {
          id: `notif_rsvp_org_${Date.now()}`,
          toUid: targetEvent.createdBy,
          type: 'event',
          title: `New RSVP: ${targetEvent.title}`,
          body: `${currentUser.name} confirmed RSVP (${newStatus === 'going' ? 'Attending' : 'Interested'}) for "${targetEvent.title}". Attendees: ${Math.max(0, targetEvent.attendeesCount + delta)}.`,
          refId: targetEvent.id,
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications((prev) => [organizerNotif, ...prev]);
        saveNotificationToFirestore(organizerNotif).catch(() => {});
      }

      addAuditLog({
        action: 'Event RSVP Registered',
        actorId: currentUser.uid,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        category: 'communication',
        details: `Alumnus confirmed RSVP (${newStatus}) for event: "${targetEvent.title}". Added to event group chat.`,
        severity: 'info'
      });
    } else {
      // Step 5: User cancelled RSVP: remove them from event group chat unless they are an admin
      const eventChatId = targetEvent.groupChatId || `chat_event_${eventId}`;
      const leaveMsg: ChatMessage = {
        id: `msg_${Date.now()}_sys_leave`,
        chatId: eventChatId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.profilePictureUrl,
        senderRole: currentUser.role,
        text: `${currentUser.name} updated their RSVP to Not Attending and left the group chat.`,
        createdAt: new Date().toISOString(),
        isSystemMessage: true
      };

      setMessages((prev) => ({
        ...prev,
        [eventChatId]: [...(prev[eventChatId] || []), leaveMsg]
      }));
      saveChatMessageToFirestore(eventChatId, leaveMsg).catch(() => {});

      setChats((prevChats) => {
        return prevChats.map((c) => {
          if (c.eventId === eventId || c.id === eventChatId) {
            if (c.memberIds.includes(currentUser.uid) && !c.adminUids?.includes(currentUser.uid)) {
              const updatedChat: ChatThread = {
                ...c,
                memberIds: c.memberIds.filter((id) => id !== currentUser.uid),
                lastMessage: `${currentUser.name} left the event group chat.`,
                lastMessageAt: new Date().toISOString()
              };
              saveChatToFirestore(updatedChat).catch(() => {});
              return updatedChat;
            }
          }
          return c;
        });
      });

      // Cancellation notification
      const cancelNotif: AppNotification = {
        id: `notif_rsvp_cancel_${Date.now()}`,
        toUid: currentUser.uid,
        type: 'event',
        title: 'RSVP Cancelled',
        body: `You have cancelled your attendance for "${targetEvent.title}". You have been removed from the event group chat.`,
        refId: targetEvent.id,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [cancelNotif, ...prev]);

      // User cancelled attendance: clean up scheduled event notifications
      setNotifications((prev) =>
        prev.filter(
          (n) =>
            n.id !== `notif_rsvp_1day_${targetEvent.id}_${currentUser.uid}` &&
            n.id !== `notif_rsvp_day_${targetEvent.id}_${currentUser.uid}`
        )
      );

      addAuditLog({
        action: 'Event RSVP Cancelled',
        actorId: currentUser.uid,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        category: 'communication',
        details: `Alumnus cancelled RSVP for event: "${targetEvent.title}". Removed from event group chat.`,
        severity: 'info'
      });
    }

    // Persist attendance update directly in Firestore
    saveEventToFirestore(updatedEvent)
      .then(() => {
        if (newStatus === 'not_going') {
          showToast(`Attendance removed for "${targetEvent.title}"`, 'info');
        } else {
          showToast(
            `RSVP confirmed: You are ${newStatus === 'going' ? 'attending' : 'interested in'} "${targetEvent.title}" and added to the group chat!`,
            'success'
          );
        }
      })
      .catch((err) => {
        console.warn('Failed to persist RSVP in Firestore:', err);
        showToast('Could not save RSVP to Firestore. Please check your connection.', 'error');
      });
  };

  const updateEventAttendance = (eventId: string, uid: string, status: 'attended' | 'not_attended' | 'pending') => {
    if (!permissions.canCreateEvents && currentUser?.role !== 'admin' && currentUser?.role !== 'registrar') {
      showToast('Permission denied: Only authorized administrators can record event attendance.', 'error');
      return;
    }
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const records = e.attendanceRecords || [];
          const existingIdx = records.findIndex((r) => r.uid === uid);
          const attendeeObj = e.attendees?.find((a) => a.uid === uid);
          const attendeeName = attendeeObj?.name || users.find((u) => u.uid === uid)?.name || 'Alumnus';
          const newRecord: EventAttendanceRecord = {
            uid,
            name: attendeeName,
            status,
            checkedInAt: status === 'attended' ? new Date().toISOString() : undefined,
            updatedBy: currentUser?.name || 'Administrator'
          };
          let updatedRecords: EventAttendanceRecord[];
          if (existingIdx >= 0) {
            updatedRecords = [...records];
            updatedRecords[existingIdx] = newRecord;
          } else {
            updatedRecords = [...records, newRecord];
          }
          const updated = { ...e, attendanceRecords: updatedRecords };
          saveEventToFirestore(updated).catch(() => {});
          return updated;
        }
        return e;
      })
    );
    showToast(`Attendance marked as ${status.replace('_', ' ')}.`);
  };

  // Announcements operations
  const createAnnouncement = (
    data: Omit<Announcement, 'id' | 'publishedAt' | 'createdBy' | 'authorName' | 'authorRole'>
  ) => {
    if (!currentUser || !permissions.canPostAnnouncements) {
      showToast('Permission denied: Only staff and admin roles can post announcements.');
      return;
    }

    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      ...data,
      publishedAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      authorName: currentUser.name,
      authorRole: currentUser.headline || currentUser.role.toUpperCase()
    };

    setAnnouncements((prev) => [newAnn, ...prev]);
    saveAnnouncementToFirestore(newAnn).catch((err) => {
      console.warn('Failed to save announcement to Firestore:', err);
    });

    // Broadcast notification
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'announcement',
      title: `${newAnn.urgent ? '🚨 URGENT: ' : newAnn.important ? '⭐ NOTICE: ' : ''}${newAnn.title}`,
      body: newAnn.content.slice(0, 110) + '...',
      read: false,
      createdAt: new Date().toISOString(),
      metadata: { announcementId: newAnn.id }
    };
    setNotifications((prev) => [notif, ...prev]);

    addAuditLog({
      action: 'Announcement Published',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'communication',
      details: `Published announcement "${newAnn.title}" [Category: ${newAnn.category || 'General'}${newAnn.urgent ? ' | URGENT' : ''}].`,
      severity: newAnn.urgent ? 'alert' : 'info'
    });

    showToast('Announcement posted and broadcast to members!');
  };

  const editAnnouncement = (id: string, data: Partial<Announcement>) => {
    if (!permissions.canPostAnnouncements) {
      showToast('Permission denied: Only staff and admin can edit announcements.');
      return;
    }
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, ...data };
          saveAnnouncementToFirestore(updated).catch(() => {});
          return updated;
        }
        return a;
      })
    );
    showToast('Announcement updated.');
  };

  const deleteAnnouncement = (id: string) => {
    if (!permissions.canPostAnnouncements) {
      showToast('Permission denied.');
      return;
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    deleteAnnouncementFromFirestore(id).catch(() => {});
    showToast('Announcement removed.');
  };

  // Opportunities & Career Portal Operations
  const createOpportunity = (
    data: Omit<Opportunity, 'id' | 'createdAt' | 'postedBy' | 'posterName' | 'status'>
  ) => {
    if (!currentUser) return;
    const isPrivileged = ['admin', 'superadmin', 'staff', 'registrar', 'moderator'].includes(currentUser.role);
    // If admin or privileged, auto-approve; if employer or alumni, requires admin approval
    const initialApproval = isPrivileged ? 'approved' : 'pending_approval';

    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      ...data,
      postedBy: currentUser.uid,
      posterName: currentUser.role === 'employer' && currentUser.companyName ? currentUser.companyName : `${currentUser.name} (${currentUser.course || currentUser.role})`,
      posterRole: currentUser.role,
      approvalStatus: data.approvalStatus || initialApproval,
      createdAt: new Date().toISOString(),
      status: 'active',
      applicationsCount: 0
    };

    setOpportunities((prev) => [newOpp, ...prev]);
    saveOpportunityToFirestore(newOpp).catch((err) => {
      console.warn('Failed to save opportunity to Firestore:', err);
    });

    if (newOpp.approvalStatus === 'pending_approval') {
      showToast('Job posting submitted for Admin Approval! Status: Pending Approval.', 'info');
      // Alert admin office
      const adminNotif: AppNotification = {
        id: `notif_job_pend_${Date.now()}`,
        type: 'general',
        title: '🔔 New Job Posting Awaiting Approval',
        body: `${newOpp.company} submitted "${newOpp.title}" for review. Click to verify & approve.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [adminNotif, ...prev]);
    } else {
      showToast('Career opportunity published to the Cecilian Job Board!', 'success');
    }
  };

  const updateOpportunity = (id: string, data: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const updated = { ...o, ...data };
          saveOpportunityToFirestore(updated).catch(() => {});
          return updated;
        }
        return o;
      })
    );
    showToast('Job posting details updated.', 'success');
  };

  const deleteOpportunity = (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    deleteOpportunityFromFirestore(id).catch(() => {});
    showToast('Opportunity removed.');
  };

  const approveOpportunity = (id: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;

    const updated = { ...opp, approvalStatus: 'approved' as const };
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? updated : o))
    );
    saveOpportunityToFirestore(updated).catch(() => {});

    // Notify the job poster
    const notif: AppNotification = {
      id: `notif_job_appr_${Date.now()}`,
      toUid: opp.postedBy,
      type: 'general',
      title: '✅ Job Posting Approved & Published!',
      body: `Your job posting "${opp.title}" at ${opp.company} has been approved by the Alumni Office and is now live for all alumni.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast(`Approved "${opp.title}". Posting is now live.`, 'success');
  };

  const rejectOpportunity = (id: string, reason: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;

    const updated = { ...opp, approvalStatus: 'rejected' as const, rejectionReason: reason };
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? updated : o))
    );
    saveOpportunityToFirestore(updated).catch(() => {});

    // Notify the job poster
    const notif: AppNotification = {
      id: `notif_job_rej_${Date.now()}`,
      toUid: opp.postedBy,
      type: 'general',
      title: '❌ Job Posting Needs Revision',
      body: `Your job posting "${opp.title}" was declined by the Alumni Office. Reason: ${reason}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast(`Job posting "${opp.title}" rejected with feedback sent.`, 'info');
  };

  // Automated Match Calculation & Job Application
  const applyForJob = (data: Omit<JobApplication, 'id' | 'appliedAt' | 'status'>): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Please log in to apply.' };

    // Check duplicate
    const existing = jobApplications.find((a) => a.jobId === data.jobId && a.applicantUid === currentUser.uid);
    if (existing) {
      showToast('You have already applied for this position.', 'info');
      return { success: false, error: 'Already applied' };
    }

    const job = opportunities.find((o) => o.id === data.jobId);
    
    // Calculate Match Score
    const reqCourse = (job?.requiredCourse || '').toLowerCase();
    const applicantCourse = (data.applicantCourse || currentUser.course || '').toLowerCase();
    const courseMatch = reqCourse ? applicantCourse.includes(reqCourse) || reqCourse.includes(applicantCourse) || reqCourse.includes('all') : true;

    const jobSkills = job?.skills || [];
    const applicantSkills = data.applicantSkills || currentUser.skills || [];
    const matchedSkillsCount = jobSkills.filter((js) =>
      applicantSkills.some((as) => as.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(as.toLowerCase()))
    ).length;

    let score = 50; // base score
    if (courseMatch) score += 25;
    if (jobSkills.length > 0) {
      score += Math.round((matchedSkillsCount / jobSkills.length) * 20);
    } else {
      score += 20;
    }
    if (data.applicantLocation && job?.location && (job.location.toLowerCase().includes('remote') || data.applicantLocation.toLowerCase().includes('cebu'))) {
      score += 5;
    }
    const finalScore = Math.min(Math.max(score, 45), 98);

    const newApp: JobApplication = {
      ...data,
      id: `app_${Date.now()}`,
      appliedAt: new Date().toISOString(),
      status: 'Applied',
      matchScore: finalScore,
      matchBreakdown: {
        courseMatch,
        skillsMatchCount: matchedSkillsCount,
        totalSkillsCount: jobSkills.length,
        locationMatch: true
      }
    };

    setJobApplications((prev) => [newApp, ...prev]);

    // Increment count on job
    setOpportunities((prev) =>
      prev.map((o) => (o.id === data.jobId ? { ...o, applicationsCount: (o.applicationsCount || 0) + 1 } : o))
    );

    // Notify employer / job poster
    if (job) {
      const employerNotif: AppNotification = {
        id: `notif_app_recv_${Date.now()}`,
        toUid: job.postedBy,
        type: 'general',
        title: `💼 New Application: ${job.title}`,
        body: `${data.applicantName} (${data.applicantCourse || 'Cecilian Graduate'}) applied for "${job.title}" with a ${finalScore}% match score!`,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [employerNotif, ...prev]);
    }

    // Confirmation notif for applicant
    const applicantNotif: AppNotification = {
      id: `notif_app_sent_${Date.now()}`,
      toUid: currentUser.uid,
      type: 'general',
      title: '🎯 Application Submitted Successfully',
      body: `Your application for "${job?.title || 'Job'}" at ${job?.company || 'Company'} was submitted. (Profile Match: ${finalScore}%)`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [applicantNotif, ...prev]);

    showToast(`Application submitted with ${finalScore}% automated profile match!`, 'success');
    return { success: true };
  };

  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus, notes?: string) => {
    const app = jobApplications.find((a) => a.id === applicationId);
    if (!app) return;

    setJobApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status, statusNotes: notes || a.statusNotes } : a))
    );

    // Notify applicant
    const notif: AppNotification = {
      id: `notif_app_status_${Date.now()}`,
      toUid: app.applicantUid,
      type: 'general',
      title: `Application Status Updated: ${status}`,
      body: `Your application for "${app.jobTitle}" at ${app.companyName} is now: ${status}.${notes ? ` Note: ${notes}` : ''}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast(`Applicant status updated to "${status}".`, 'success');
  };

  const verifyEmployer = (employerUid: string, verified: boolean, notes?: string) => {
    let updatedEmployer: UserProfile | undefined;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === employerUid) {
          updatedEmployer = {
            ...u,
            isVerified: verified,
            employerVerificationStatus: verified ? 'verified' : 'rejected',
            canPostJobs: verified,
            employerVerificationNotes: notes || (verified ? 'Accredited by Alumni Office' : 'Application declined')
          };
          return updatedEmployer;
        }
        return u;
      })
    );

    if (updatedEmployer) {
      saveUserToFirestore(updatedEmployer).catch(() => {});
    }

    const notif: AppNotification = {
      id: `notif_emp_ver_${Date.now()}`,
      toUid: employerUid,
      type: 'general',
      title: verified ? '🏢 Employer Verification Approved!' : 'Employer Verification Status Update',
      body: verified
        ? 'Congratulations! Your company registration has been approved and accredited by St. Cecilia’s College Alumni Office. You may now post career opportunities.'
        : `Employer verification update: ${notes || 'Please contact the alumni office for accreditation details.'}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif).catch(() => {});

    addAuditLog({
      action: verified ? 'Employer Registration Approved' : 'Employer Registration Rejected',
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'admin',
      category: 'admin',
      details: `Company ${employerUid} verification status set to ${verified ? 'verified' : 'rejected'}. Job posting authorization: ${verified ? 'Active' : 'Disabled'}.${notes ? ` Notes: ${notes}` : ''}`,
      severity: verified ? 'success' : 'warning'
    });

    showToast(
      verified
        ? 'Employer partner approved & accredited. Job posting permissions activated!'
        : 'Employer partner registration rejected.',
      verified ? 'success' : 'info'
    );
  };

  const toggleEmployerJobPosting = (employerUid: string, canPost: boolean) => {
    let updatedEmployer: UserProfile | undefined;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === employerUid) {
          updatedEmployer = {
            ...u,
            canPostJobs: canPost
          };
          return updatedEmployer;
        }
        return u;
      })
    );

    if (updatedEmployer) {
      saveUserToFirestore(updatedEmployer).catch(() => {});
    }

    addAuditLog({
      action: 'Employer Job Posting Rights Changed',
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'admin',
      category: 'admin',
      details: `Company ${employerUid} job posting rights updated to: ${canPost ? 'Enabled' : 'Disabled'}.`,
      severity: 'info'
    });

    showToast(`Company job posting permission set to ${canPost ? 'Enabled' : 'Disabled'}.`, 'success');
  };

  const selfVerifyAlumniWithRegistry = async (studentId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Must be logged in to verify.' };
    }
    const res = await verifyAlumniStatus(studentId);
    return {
      success: res.isVerified,
      message: res.message
    };
  };

  // Connection status checker against connections and requests
  const getConnectionStatus = useCallback(
    (otherUid: string): 'pending' | 'accepted' | 'declined' | null => {
      if (!currentUser || !otherUid) return null;
      if (connectionsMap[currentUser.uid]?.includes(otherUid)) return 'accepted';
      const req = friendRequests.find(
        (r) =>
          (r.fromUid === currentUser.uid && r.toUid === otherUid) ||
          (r.fromUid === otherUid && r.toUid === currentUser.uid)
      );
      if (req) {
        return req.status;
      }
      return null;
    },
    [currentUser, connectionsMap, friendRequests]
  );

  // Global Alumni Academic Record Verification Gate State
  const isAlumniVerified = useMemo(() => {
    if (!currentUser) return false;
    if (['admin', 'staff', 'registrar', 'moderator', 'superadmin'].includes(currentUser.role)) return true;
    if (currentUser.role === 'employer') {
      return Boolean((currentUser.isVerified || currentUser.verified) && currentUser.verificationStatus !== 'rejected');
    }
    return Boolean(
      (currentUser.isVerified === true || currentUser.verified === true) &&
      currentUser.verificationStatus !== 'pending_review' &&
      currentUser.verificationStatus !== 'flagged' &&
      currentUser.verificationStatus !== 'rejected'
    );
  }, [currentUser]);

  const verifyAlumniStatus = useCallback(
    async (studentIdToVerify: string): Promise<RegistrarVerificationResult> => {
      const result = registrar_verification(studentIdToVerify, currentUser?.name);

      if (result.isVerified && result.record && currentUser) {
        const updated: UserProfile = {
          ...currentUser,
          studentId: result.record.studentId,
          isVerified: true,
          verified: true,
          verificationStatus: 'verified',
          verificationFlagReason: undefined,
          batch: result.record.batchYear || currentUser.batch,
          course: result.record.course || currentUser.course
        };
        setUsers((prev) => prev.map((u) => (u.uid === currentUser.uid ? updated : u)));
        await saveUserToFirestore(updated);
        markRegistryRecordAsRegistered(result.record.studentId, currentUser.uid);
        showToast(result.message, 'success');
      } else {
        if (currentUser) {
          const updated: UserProfile = {
            ...currentUser,
            studentId: studentIdToVerify,
            isVerified: false,
            verified: false,
            verificationStatus: 'rejected',
            verificationFlagReason: result.message
          };
          setUsers((prev) => prev.map((u) => (u.uid === currentUser.uid ? updated : u)));
          saveUserToFirestore(updated).catch(() => {});
        }
        showToast(result.message, 'error');
      }
      return result;
    },
    [registrar_verification, currentUser, showToast]
  );

  // Notifications operations
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUserId) return;
    setNotifications((prev) =>
      prev.map((n) => (n.toUid === currentUserId ? { ...n, read: true } : n))
    );
    showToast('All notifications marked as read.');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Settings operations
  const updateNotificationSettings = (settings: Partial<UserNotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...settings }));
    showToast('Notification preferences saved.');
  };

  const updateUserSettings = (settings: any) => {
    if (
      settings.notificationsPush !== undefined ||
      settings.notificationsEmail !== undefined ||
      settings.notificationsMessages !== undefined ||
      settings.notificationsEvents !== undefined
    ) {
      updateNotificationSettings({
        pushNotifications: settings.notificationsPush ?? settings.pushNotifications,
        emailDigests: settings.notificationsEmail ?? settings.emailDigests,
        directMessages: settings.notificationsMessages ?? settings.directMessages,
        eventReminders: settings.notificationsEvents ?? settings.eventReminders
      });
    } else {
      updateNotificationSettings(settings);
    }
  };

  // Admin Actions
  const verifyUser = (uid: string) => {
    if (!permissions.canAccessAdminPanel) {
      showToast('Permission denied: Admin clearance required.');
      return;
    }
    const target = users.find((u) => u.uid === uid);
    const newStatus = target ? !target.isVerified : true;

    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, isVerified: newStatus } : u))
    );
    alumniService.updateAlumni(uid, { isVerified: newStatus }).catch((err) => {
      console.warn('Error updating verification status in Firestore:', err);
    });
    showToast('User verification status updated.');
  };

  const updateUserRole = (uid: string, newRole: UserRole) => {
    // Immutable Role Constraint: Assigned roles are permanent and cannot be modified even by administrators.
    showToast('Role modification disabled: Assigned roles are permanent and immutable. System policy prohibits modifying user roles.', 'error');
    console.warn(`Attempted role change for ${uid} to ${newRole} rejected: roles are immutable.`);
    return;
  };

  const deleteAlumni = async (uid: string): Promise<boolean> => {
    if (!permissions.canAccessAdminPanel) {
      showToast('Permission denied: Only administrators can remove alumni records.');
      return false;
    }
    try {
      await alumniService.deleteAlumni(uid);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      showToast('Alumni record deleted successfully from directory.');
      return true;
    } catch (err) {
      console.error('Failed to delete alumnus:', err);
      showToast('Error removing alumni record from Firestore.');
      return false;
    }
  };

  // Alumni Service Operations (direct Firestore CRUD)
  const fetchAlumni = async (): Promise<UserProfile[]> => {
    try {
      setIsFirestoreSyncing(true);
      const liveUsers = await alumniService.getAllAlumni();
      if (liveUsers && liveUsers.length > 0) {
        setUsers(liveUsers);
        return liveUsers;
      }
      return [];
    } catch (err) {
      console.warn('Error fetching alumni from Firestore service:', err);
      return [];
    } finally {
      setIsFirestoreSyncing(false);
    }
  };

  const createAlumni = async (profile: UserProfile): Promise<UserProfile | undefined> => {
    try {
      const created = await alumniService.createAlumni(profile);
      if (created) {
        setUsers((prev) => {
          const exists = prev.some((u) => u.uid === created.uid);
          return exists ? prev.map((u) => (u.uid === created.uid ? created : u)) : [created, ...prev];
        });
        showToast(`Alumni record created for ${created.name}.`);
      }
      return created;
    } catch (err) {
      console.error('Failed to create alumni in Firestore:', err);
      showToast('Error creating alumni profile in Firestore.');
      return undefined;
    }
  };

  const updateAlumniProfile = async (uid: string, updates: Partial<UserProfile>): Promise<Partial<UserProfile> | undefined> => {
    try {
      const updated = await alumniService.updateAlumni(uid, updates);
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...updated } : u)));
        showToast('Alumni profile updated successfully.');
      }
      return updated;
    } catch (err) {
      console.error('Failed to update alumni in Firestore:', err);
      showToast('Error updating alumni profile in Firestore.');
      return undefined;
    }
  };

  const createChapter = (ch: Omit<Chapter, 'id'>) => {
    if (!permissions.canAccessAdminPanel) return;
    const newChap: Chapter = {
      id: `chap_${Date.now()}`,
      ...ch
    };
    setChapters((prev) => [...prev, newChap]);
    showToast(`Alumni Chapter "${ch.name}" created!`);
  };

  const createMilestone = (m: Omit<CareerMilestone, 'id'>) => {
    const isAuthorized = permissions.canAccessAdminPanel || currentUser?.role === 'alumni' || currentUser?.role === 'staff';
    if (!isAuthorized) {
      showToast('Permission denied to publish milestones.');
      return;
    }
    const newM: CareerMilestone = {
      id: `m_${Date.now()}`,
      authorId: currentUser?.uid,
      authorName: currentUser?.name || 'Administrator',
      authorRole: currentUser?.role,
      createdAt: new Date().toISOString(),
      likes: [],
      ...m
    };
    setMilestones((prev) => [newM, ...prev]);

    // Broadcast notification to all users
    const notif: AppNotification = {
      id: `notif_m_${Date.now()}`,
      toUid: 'all',
      type: 'announcement',
      title: `New Milestone Spotlight: ${newM.title}`,
      body: `${newM.authorName} published a spotlight in ${newM.category}: "${newM.title}". Check it out on the dashboard!`,
      refId: newM.id,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('Milestone & gallery post published to dashboard feed!');
  };

  const toggleLikeMilestone = (milestoneId: string) => {
    if (!currentUser) return;
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === milestoneId) {
          const currentLikes = m.likes || [];
          const isLiked = currentLikes.includes(currentUser.uid);
          const updatedLikes = isLiked
            ? currentLikes.filter((uid) => uid !== currentUser.uid)
            : [...currentLikes, currentUser.uid];
          return { ...m, likes: updatedLikes };
        }
        return m;
      })
    );
  };

  const deleteMilestone = (milestoneId: string) => {
    if (!permissions.canAccessAdminPanel && currentUser?.role !== 'admin') {
      showToast('Permission denied to remove milestone post.');
      return;
    }
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    showToast('Milestone post removed from feed.');
  };

  const isEmployerExpired = useCallback((user?: UserProfile | null): boolean => {
    if (!user || user.role !== 'employer') return false;
    if (user.employerStatus === 'expired') return true;
    if (user.employerExpirationDate) {
      return new Date(user.employerExpirationDate).getTime() < Date.now();
    }
    // Default active period: 365 days from user.createdAt or default 1 year
    if (user.createdAt) {
      const createdTime = new Date(user.createdAt).getTime();
      const defaultExpiry = createdTime + 365 * 86400000;
      return defaultExpiry < Date.now();
    }
    return false;
  }, []);

  const requestEmployerRenewal = useCallback((notes: string) => {
    if (!currentUser || currentUser.role !== 'employer') return;
    const updated = {
      ...currentUser,
      employerStatus: 'pending_renewal' as const,
      employerRenewalRequested: true,
      employerRenewalNotes: notes
    };
    updateProfile(updated);

    // Notify administrators
    const adminNotif: AppNotification = {
      id: `notif_renew_req_${Date.now()}`,
      toUid: 'all',
      type: 'general',
      title: 'Employer Accreditation Renewal Requested',
      body: `Employer "${currentUser.companyName || currentUser.name}" submitted a renewal request: "${notes.slice(0, 80)}..."`,
      refId: currentUser.uid,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [adminNotif, ...prev]);
    showToast('Renewal request submitted for administrator review.');
  }, [currentUser, updateProfile]);

  const renewEmployerAccount = useCallback((uid: string, extensionMonths: number = 12) => {
    const target = users.find((u) => u.uid === uid);
    if (!target) return;
    const currentExpiry = target.employerExpirationDate && new Date(target.employerExpirationDate).getTime() > Date.now()
      ? new Date(target.employerExpirationDate).getTime()
      : Date.now();
    const newExpiry = new Date(currentExpiry + extensionMonths * 30 * 86400000).toISOString();

    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          return {
            ...u,
            employerStatus: 'active',
            employerExpirationDate: newExpiry,
            employerRenewalRequested: false,
            employerRenewalNotes: undefined,
            employerVerificationStatus: 'verified',
            canPostJobs: true
          };
        }
        return u;
      })
    );

    const renewNotif: AppNotification = {
      id: `notif_renew_${Date.now()}`,
      toUid: uid,
      type: 'security',
      title: 'Accreditation Extended & Restored',
      body: `Your partner account accreditation has been successfully extended for ${extensionMonths} months. Valid through ${new Date(newExpiry).toLocaleDateString()}.`,
      refId: uid,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [renewNotif, ...prev]);
    showToast(`Accreditation renewed for ${extensionMonths} months.`);
  }, [users, currentUser]);

  // Automated Employer Expiration System and Renewal Warning Notification Engine
  const checkAndEnforceEmployerExpirations = useCallback(() => {
    let expiredCount = 0;
    let warningsCount = 0;
    const now = Date.now();
    const newNotifications: AppNotification[] = [];

    setUsers((prevUsers) => {
      let stateChanged = false;
      const updated = prevUsers.map((user) => {
        if (user.role !== 'employer') return user;

        let expiryTimestamp: number | null = null;
        if (user.employerExpirationDate) {
          expiryTimestamp = new Date(user.employerExpirationDate).getTime();
        } else if (user.createdAt) {
          expiryTimestamp = new Date(user.createdAt).getTime() + 365 * 86400000;
        }

        if (!expiryTimestamp || isNaN(expiryTimestamp)) return user;

        const msUntilExpiry = expiryTimestamp - now;
        const daysUntilExpiry = Math.ceil(msUntilExpiry / 86400000);

        // Check if expiration date has been reached
        if (daysUntilExpiry <= 0) {
          if (user.employerStatus !== 'expired' || user.canPostJobs !== false) {
            expiredCount++;
            stateChanged = true;
            const updatedUser: UserProfile = {
              ...user,
              employerStatus: 'expired',
              canPostJobs: false
            };

            // Persist expiration status asynchronously to Firestore
            alumniService.updateAlumni(user.uid, {
              employerStatus: 'expired',
              canPostJobs: false
            }).catch(() => {});

            // Dispatch Account Expired Notification
            const expNotif: AppNotification = {
              id: `notif_emp_expired_${user.uid}_${now}`,
              toUid: user.uid,
              type: 'security',
              title: 'Account Accreditation Expired',
              body: `Your institutional partner accreditation for "${user.companyName || user.name}" has expired on ${new Date(expiryTimestamp).toLocaleDateString()}. Job posting and candidate contact privileges have been set to inactive. Please submit a renewal request to restore active status.`,
              refId: user.uid,
              read: false,
              createdAt: new Date().toISOString()
            };
            newNotifications.push(expNotif);

            addAuditLog({
              action: 'Employer Account Automatically Expired',
              actorId: 'system_automation',
              actorName: 'System Expiration Engine',
              actorRole: 'system',
              category: 'security',
              details: `Employer accreditation for "${user.companyName || user.name}" reached expiration date (${new Date(expiryTimestamp).toLocaleDateString()}). Status set to 'Expired' and posting privileges disabled.`,
              severity: 'warning'
            });

            return updatedUser;
          }
        } else {
          // Warning notifications (30-day, 14-day, 7-day, 1-day)
          let warningTitle: string | null = null;
          let warningBody: string | null = null;

          if (daysUntilExpiry <= 1) {
            warningTitle = 'Accreditation Expiry Warning (1 Day Remaining)';
            warningBody = `Urgent Final Notice: Your employer accreditation for "${user.companyName || user.name}" expires tomorrow. Please submit a renewal request to avoid interruption.`;
          } else if (daysUntilExpiry <= 7) {
            warningTitle = 'Accreditation Expiry Notice (7 Days Remaining)';
            warningBody = `Your employer accreditation will expire in ${daysUntilExpiry} days. Please prepare your renewal documentation.`;
          } else if (daysUntilExpiry <= 14) {
            warningTitle = 'Accreditation Renewal Notice (14 Days Remaining)';
            warningBody = `Your partner accreditation is due for renewal in 2 weeks. Submit a renewal request to ensure continuous access.`;
          } else if (daysUntilExpiry <= 30) {
            warningTitle = 'Accreditation Renewal Notice (30 Days Remaining)';
            warningBody = `Annual accreditation notice: Your partner account is scheduled for expiration in ${daysUntilExpiry} days.`;
          }

          if (warningTitle && warningBody) {
            const alreadyExists = notifications.some(
              (n) => n.toUid === user.uid && n.title === warningTitle
            );
            if (!alreadyExists) {
              warningsCount++;
              const warnNotif: AppNotification = {
                id: `notif_emp_warn_${daysUntilExpiry}_${user.uid}_${now}`,
                toUid: user.uid,
                type: 'security',
                title: warningTitle,
                body: warningBody,
                refId: user.uid,
                read: false,
                createdAt: new Date().toISOString()
              };
              newNotifications.push(warnNotif);
            }
          }
        }

        return user;
      });

      return stateChanged ? updated : prevUsers;
    });

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev]);
      newNotifications.forEach((n) => {
        saveNotificationToFirestore(n).catch(() => {});
      });
    }

    return { expiredCount, warningsCount };
  }, [notifications, addAuditLog, currentUser, isEmployerExpired]);

  // Run automatic expiration check on component mount and on interval
  useEffect(() => {
    checkAndEnforceEmployerExpirations();
    const interval = setInterval(() => {
      checkAndEnforceEmployerExpirations();
    }, 60000 * 30); // check every 30 minutes
    return () => clearInterval(interval);
  }, [checkAndEnforceEmployerExpirations]);

  const submitCareerSurvey = useCallback((survey: Omit<CareerSurveyResponse, 'id' | 'submittedAt'>) => {
    const newSurvey: CareerSurveyResponse = {
      id: `survey_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      ...survey
    };
    setCareerSurveys((prev) => [newSurvey, ...prev]);

    if (currentUser) {
      updateProfile({
        employmentStatus: survey.employmentStatus,
        currentPosition: survey.jobTitle || currentUser.currentPosition,
        company: survey.company || currentUser.company
      });
    }

    addAuditLog({
      action: 'Graduate Tracer Survey Submitted',
      actorId: survey.uid,
      actorName: survey.userName,
      actorRole: 'alumni',
      category: 'career',
      details: `Response recorded for ${survey.userName} (${survey.course}, Batch ${survey.batch}) - Status: ${survey.employmentStatus}.`,
      severity: 'success'
    });

    showToast('Graduate tracer survey submitted! Thank you for supporting institutional accreditation.', 'success');
  }, [currentUser, updateProfile, addAuditLog, showToast]);

  const triggerDatabaseBackup = useCallback((type: 'automated' | 'manual' = 'manual') => {
    const newSnapshot: DatabaseBackupSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recordCount: users.length,
      sizeKb: Math.round(128 + Math.random() * 20),
      status: 'verified',
      type
    };
    setBackups((prev) => [newSnapshot, ...prev]);

    addAuditLog({
      action: 'Database Snapshot Backup Created',
      actorId: currentUser?.uid || 'system',
      actorName: currentUser?.name || 'Automated Backup Daemon',
      actorRole: currentUser?.role || 'system',
      category: 'admin',
      details: `Encrypted point-in-time snapshot created (${users.length} alumni, ${events.length} events). Verified integrity.`,
      severity: 'info'
    });

    showToast('Encrypted database backup snapshot created and verified.', 'success');
  }, [users.length, events.length, currentUser, addAuditLog, showToast]);

  const runAutomationJob = useCallback((jobId: string) => {
    setAutomationJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            lastRun: new Date().toISOString(),
            triggerCount: job.triggerCount + 1,
            status: 'active'
          };
        }
        return job;
      })
    );

    const targetJob = automationJobs.find((j) => j.id === jobId);
    const jobName = targetJob?.name || 'Automation Job';

    if (jobId === 'job_backup_daily') {
      triggerDatabaseBackup('manual');
      return;
    }

    addAuditLog({
      action: `Automation Job Triggered: ${jobName}`,
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'System Operator',
      actorRole: currentUser?.role || 'admin',
      category: 'admin',
      details: `Manual run dispatched for "${jobName}".`,
      severity: 'info'
    });

    showToast(`Automation job "${jobName}" triggered successfully.`, 'success');
  }, [automationJobs, currentUser, triggerDatabaseBackup, addAuditLog, showToast]);

  const unlockUserAccount = useCallback((uid: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, isLocked: false, lockedUntil: undefined, failedLoginAttempts: 0 } : u))
    );
    const target = users.find((u) => u.uid === uid);
    addAuditLog({
      action: 'Security Lockout Lifted',
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'admin',
      category: 'security',
      details: `Account ${target?.name || uid} was unlocked by administrator. Failed attempts reset.`,
      severity: 'warning'
    });
    showToast(`Account for ${target?.name || 'user'} has been unlocked.`, 'success');
  }, [users, currentUser, addAuditLog, showToast]);

  const verifyAndApproveAlumni = useCallback((uid: string, approve: boolean, flagReason?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          return {
            ...u,
            isVerified: approve,
            verificationStatus: approve ? 'verified' : 'rejected',
            verificationFlagReason: flagReason
          };
        }
        return u;
      })
    );

    const target = users.find((u) => u.uid === uid);
    addAuditLog({
      action: approve ? 'Alumni Account Approved' : 'Alumni Account Flagged / Rejected',
      actorId: currentUser?.uid || 'admin',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'admin',
      category: 'alumni_registration',
      details: approve
        ? `Alumnus "${target?.name}" (${target?.email}) officially approved and verified against registrar archives.`
        : `Alumnus registration for "${target?.name}" flagged: ${flagReason || 'Requires additional registrar validation'}.`,
      severity: approve ? 'success' : 'warning'
    });

    showToast(
      approve ? `Alumnus "${target?.name}" approved & verified!` : `Alumnus record marked with review flag.`,
      approve ? 'success' : 'info'
    );
  }, [users, currentUser, addAuditLog, showToast]);

  const sendEmergencyAnnouncement = useCallback((title: string, content: string) => {
    if (!currentUser || !permissions.canPostAnnouncements) {
      showToast('Permission denied: Staff/Admin authorization required.');
      return;
    }
    const newAnn: Announcement = {
      id: `ann_emerg_${Date.now()}`,
      title,
      content,
      important: true,
      urgent: true,
      category: 'emergency',
      publishedAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      authorName: currentUser.name,
      authorRole: currentUser.headline || currentUser.role.toUpperCase()
    };

    setAnnouncements((prev) => [newAnn, ...prev]);

    const notif: AppNotification = {
      id: `notif_emerg_${Date.now()}`,
      type: 'announcement',
      title: `🚨 EMERGENCY ADVISORY: ${title}`,
      body: content.slice(0, 140) + '...',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev]);

    addAuditLog({
      action: 'Emergency Broadcast Advisory Dispatched',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'communication',
      details: `Urgent institutional advisory broadcast dispatched: "${title}".`,
      severity: 'alert'
    });

    showToast('Emergency announcement broadcast dispatched to all members.', 'success');
  }, [currentUser, permissions.canPostAnnouncements, addAuditLog, showToast]);

  const updateEmploymentStatus = useCallback((status: 'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired') => {
    if (!currentUser) return;
    updateProfile({ employmentStatus: status, lastEmploymentUpdateReminder: new Date().toISOString() });
    addAuditLog({
      action: 'Employment Information Updated',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'career',
      details: `Status set to "${status}".`,
      severity: 'info'
    });
    showToast(`Employment status updated to: ${status}`, 'success');
  }, [currentUser, updateProfile, addAuditLog, showToast]);

  const syncAllDataToCloud = useCallback(async () => {
    setIsFirestoreSyncing(true);
    showToast('Pushing all institutional datasets to Cloud Firestore...', 'info');
    try {
      const regRecords = getRegistrarRecords();
      const result = await syncAllCollectionsToFirestore({
        users,
        events,
        opportunities,
        announcements,
        registryRecords: regRecords,
        auditLogs,
        onProgress: (step) => {
          console.info('[Cloud Sync Progress]:', step);
        }
      });

      if (result.success) {
        showToast(
          `Cloud Sync Complete: ${result.syncedCounts.users} Users, ${result.syncedCounts.events} Events, ${result.syncedCounts.opportunities} Opportunities, ${result.syncedCounts.announcements} Announcements, ${result.syncedCounts.registry_records} Student Registry records written to Firestore.`,
          'success'
        );
      } else {
        showToast(
          `Sync completed with notices: ${result.errors.slice(0, 2).join('; ')}`,
          'warning'
        );
      }
    } catch (err: any) {
      console.warn('Manual Firestore sync error:', err);
      showToast(`Firestore synchronization notice: ${err?.message || err}`, 'error');
    } finally {
      setIsFirestoreSyncing(false);
    }
  }, [users, events, opportunities, announcements, auditLogs, showToast]);

  return (
    <AlumniContext.Provider
      value={{
        currentUser,
        users,
        friendRequests,
        chats,
        messages,
        notifications,
        events,
        announcements,
        opportunities,
        chapters,
        milestones,
        notificationSettings,
        activeTab,
        setActiveTab,
        selectedUserIdForModal,
        setSelectedUserIdForModal,
        permissions,
        isFirebaseConnected,
        isFirestoreSyncing,
        loginWithGoogle,
        syncAllDataToCloud,
        login,
        register,
        logout,
        switchUser,
        resetPassword,
        resetUserPasswordByEmail,
        deleteAccount,
        changeEmail,
        changePassword,
        updateProfile,
        addExperience,
        removeExperience,
        addEducation,
        removeEducation,
        followingIds,
        connectionIds,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        toggleFollow,
        isFollowing,
        isConnected,
        hasPendingRequestWith,
        activeChatId,
        setActiveChatId,
        sendMessage,
        getOrCreateChat,
        markChatAsRead,
        createEvent,
        editEvent,
        deleteEvent,
        toggleLikeEvent,
        addCommentToEvent,
        rsvpEvent,
        updateEventAttendance,
        createAnnouncement,
        editAnnouncement,
        deleteAnnouncement,
        createOpportunity,
        updateOpportunity,
        deleteOpportunity,
        approveOpportunity,
        rejectOpportunity,
        applyForJob,
        updateApplicationStatus,
        verifyEmployer,
        toggleEmployerJobPosting,
        selfVerifyAlumniWithRegistry,
        isAlumniVerified,
        registrar_verification,
        verifyAlumniStatus,
        getConnectionStatus,
        jobApplications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        updateNotificationSettings,
        updateUserSettings,
        galleryItems,
        addGalleryItem,
        deleteGalleryItem,
        createUserByAdmin,
        fetchAlumni,
        createAlumni,
        updateAlumniProfile,
        verifyUser,
        setUserVerified: (uid: string, _status?: boolean) => verifyUser(uid),
        updateUserRole,
        setUserRole: updateUserRole,
        deleteAlumni,
        createChapter,
        createMilestone,
        toggleLikeMilestone,
        deleteMilestone,
        isEmployerExpired,
        requestEmployerRenewal,
        renewEmployerAccount,
        checkAndEnforceEmployerExpirations,
        auditLogs,
        automationJobs,
        careerSurveys,
        backups,
        addAuditLog,
        submitCareerSurvey,
        runAutomationJob,
        triggerDatabaseBackup,
        unlockUserAccount,
        verifyAndApproveAlumni,
        sendEmergencyAnnouncement,
        updateEmploymentStatus,
        toasts,
        toastMessage,
        showToast,
        dismissToast
      }}
    >
      {children}
    </AlumniContext.Provider>
  );
};

export const useAlumni = () => {
  const context = useContext(AlumniContext);
  if (!context) {
    throw new Error('useAlumni must be used within an AlumniProvider');
  }
  return context;
};

export type UserRole = 'alumni' | 'student' | 'faculty' | 'admin' | 'registrar' | 'staff' | 'moderator' | 'superadmin' | 'employer';

export const OFFICIAL_DEGREE_PROGRAMS = [
  'B.S. Information Technology',
  'B.S. Computer Science',
  'B.S. Information Systems',
  'B.S. Computer Engineering',
  'B.S. Accountancy',
  'B.S. Business Administration',
  'B.S. Hospitality Management',
  'B.S. Tourism Management',
  'B.S. Nursing',
  'B.S. Criminology',
  'B.S. Education',
  'B.S. Secondary Education',
  'B.S. Elementary Education',
  'B.S. Public Administration',
  'B.S. Psychology'
] as const;

export type DegreeProgram = typeof OFFICIAL_DEGREE_PROGRAMS[number] | string;

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  honors?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  batch?: string; // e.g., "2019"
  course?: string; // e.g., "B.S. Computer Science"
  location: string;
  profilePictureUrl: string;
  coverPhotoUrl: string;
  headline: string;
  about: string;
  bio?: string;
  phone: string;
  isVerified?: boolean;
  verified?: boolean;
  followersCount: number;
  followingCount: number;
  connectionsCount: number;
  skills?: string[];
  currentPosition?: string;
  company?: string;
  experience: Experience[];
  education: Education[];
  createdAt: string;
  alumniId?: string; // Official Alumni ID (e.g. SCC-ALUM-2024-0192), distinct from Student ID
  studentId?: string; // Student ID from academic registrar records
  employeeId?: string;
  department?: string;
  password?: string;
  authProvider?: 'password' | 'google' | 'firebase';
  settings?: Record<string, any>;
  // Automation & System Health Fields
  employmentStatus?: 'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired';
  birthday?: string; // 'YYYY-MM-DD' or 'MM-DD'
  lastLoginAt?: string;
  engagementScore?: number; // 0 - 100
  verificationStatus?: 'verified' | 'pending_review' | 'flagged' | 'rejected';
  verificationFlagReason?: string;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: string;
  emailVerified?: boolean;
  lastProfileUpdateReminder?: string;
  lastEmploymentUpdateReminder?: string;
  // Employer / Partner Company Specific Profile Fields
  companyName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companyAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  employerVerificationStatus?: 'pending_verification' | 'verified' | 'rejected';
  employerVerificationNotes?: string;
  canPostJobs?: boolean;
  profileCompleted?: boolean;
  industry?: string;
  yearsOfExperience?: string | number;
  workLocation?: string;
  privacyConsentAccepted?: boolean;
  privacyConsentDate?: string;
  zeroDisclosureAccepted?: boolean;
  zeroDisclosureDate?: string;
  employerExpirationDate?: string;
  employerStatus?: 'active' | 'expired' | 'pending_renewal' | 'pending_verification';
  employerRenewalRequested?: boolean;
  employerRenewalNotes?: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string; // usually `${fromUid}_${toUid}`
  fromUid: string;
  toUid: string;
  status: FriendRequestStatus;
  createdAt: string;
  senderProfile?: UserProfile;
  receiverProfile?: UserProfile;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: UserRole;
  isSystemMessage?: boolean;
}

export interface ChatThread {
  id: string;
  memberIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: Record<string, number>; // uid -> count
  otherUser?: UserProfile;
  isGroupChat?: boolean;
  groupName?: string;
  groupDescription?: string;
  eventId?: string;
  isEventChat?: boolean;
  adminUids?: string[];
}

export type NotificationType = 
  | 'friend_request'
  | 'friend_accepted'
  | 'event_broadcast'
  | 'announcement_broadcast'
  | 'message'
  | 'general'
  | 'event'
  | 'announcement'
  | 'profile_update'
  | 'security';

export interface AppNotification {
  id: string;
  toUid?: string;
  fromUid?: string;
  type: NotificationType;
  title: string;
  body: string;
  refId?: string; // e.g. eventId, friendRequestId, announcementId, chatId
  actionStatus?: 'pending' | 'accepted' | 'declined';
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
  fromUser?: UserProfile;
}

export interface EventComment {
  id: string;
  eventId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface EventAttendee {
  uid: string;
  name: string;
  avatar: string;
  batch?: string;
  course?: string;
  role?: UserRole;
  status: 'going' | 'interested';
  rsvpDate: string;
}

export interface EventAttendanceRecord {
  uid: string;
  name: string;
  status: 'attended' | 'not_attended' | 'pending';
  checkedInAt?: string;
  updatedBy?: string;
}

export interface AlumniEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  type: 'reunion' | 'workshop' | 'networking' | 'webinar' | 'social';
  startDate: string; // ISO string
  endDate: string;
  heroImageUrl: string;
  eventImages?: string[];
  isVirtual: boolean;
  isImportant: boolean;
  maxAttendees: number;
  attendeesCount: number;
  createdBy: string;
  createdByName?: string;
  likes: string[]; // array of uids who liked
  comments: EventComment[];
  userRsvp?: 'going' | 'interested' | 'not_going' | null;
  attendees?: EventAttendee[];
  attendanceRecords?: EventAttendanceRecord[];
  groupChatId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  important: boolean;
  urgent?: boolean;
  category?: 'department' | 'batch' | 'institutional' | 'emergency';
  targetBatches?: string[];
  targetDepartments?: string[];
  publishedAt: string;
  createdBy: string;
  authorName: string;
  authorRole: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Mentorship';
  company: string;
  location: string;
  description: string;
  salaryOrStipend?: string;
  skills?: string[];
  applicationUrl?: string;
  contactEmail?: string;
  postedBy: string;
  posterName: string;
  posterRole?: UserRole;
  createdAt: string;
  status: 'active' | 'closed';
  // Automated matching & workflow fields
  requiredCourse?: string; // e.g. 'BS Information Technology'
  experienceLevel?: string; // e.g. '0–2 years', 'Fresh Graduate', '3–5 years'
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  rejectionReason?: string;
  applicationDeadline?: string;
  howToApply?: 'internal' | 'external' | 'both';
  applicationsCount?: number;
}

export type ApplicationStatus = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicantUid: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantCourse?: string;
  applicantBatch?: string;
  applicantSkills?: string[];
  applicantLocation?: string;
  portfolioUrl?: string;
  resumeFileName?: string;
  resumeSummary?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  statusNotes?: string;
  appliedAt: string;
  matchScore?: number;
  matchBreakdown?: {
    courseMatch: boolean;
    skillsMatchCount: number;
    totalSkillsCount: number;
    locationMatch: boolean;
  };
}

export interface Chapter {
  id: string;
  name: string;
  region: string;
  leadName: string;
  leadEmail: string;
  memberCount: number;
  meetingFrequency: string;
  description: string;
}

export interface TaggedAlumnus {
  uid: string;
  name: string;
  batch?: string;
  avatar?: string;
}

export interface CareerMilestone {
  id: string;
  uid?: string;
  alumniName?: string;
  batch?: string;
  title: string;
  company?: string;
  category: 'Promotion' | 'Startup' | 'Award' | 'Publication' | 'Leadership' | 'Campus Gallery' | 'Achievement' | string;
  date: string;
  description: string;
  images?: string[];
  taggedAlumniIds?: string[];
  taggedAlumni?: TaggedAlumnus[];
  likes?: string[];
  authorId?: string;
  authorName?: string;
  authorRole?: UserRole;
  createdAt?: string;
}

export interface UserNotificationSettings {
  pushNotifications: boolean;
  emailDigests: boolean;
  directMessages: boolean;
  eventReminders: boolean;
}

export interface GalleryItem {
  id: string;
  category: 'campus' | 'homecoming' | 'commencement' | 'heritage';
  title: string;
  year: string;
  url: string;
  description?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploaderRole?: UserRole;
  createdAt?: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotification {
  id: string;
  message: string;
  type: ToastType;
}

export interface StudentVerificationRecord {
  studentId: string;
  fullName: string;
  batchYear: string;
  course: string;
  status: 'Graduated' | 'Enrolled' | 'Alumni' | 'unverified' | 'duplicate';
  honors?: string;
  verifiedAt?: string;
  email?: string;
  phone?: string;
  isRegistered?: boolean;
  registeredAt?: string;
  matchedUid?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  sourceFile?: string;
  verification_status?: string;
}

export interface RegistrarVerificationResult {
  isVerified: boolean;
  status: 'verified' | 'unconfirmed' | 'format_error' | 'not_found';
  message: string;
  studentId?: string;
  record?: StudentVerificationRecord;
}

export interface RegistrationConflictRecord {
  id: string;
  applicantUid?: string;
  applicantName: string;
  applicantEmail: string;
  applicantStudentId?: string;
  applicantBatch?: string;
  applicantCourse?: string;
  targetRegistryStudentId?: string;
  registryRecord?: StudentVerificationRecord;
  conflictType: 'name_mismatch' | 'duplicate_id' | 'email_mismatch' | 'batch_discrepancy' | 'partial_match';
  severity: 'high' | 'medium' | 'low';
  confidenceScore: number;
  flaggedAt: string;
  status: 'pending' | 'resolved_verified' | 'resolved_rejected' | 'dismissed';
  notes: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ==========================================
// ALUMNI MANAGEMENT AUTOMATIONS INTERFACES
// ==========================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  category: 'alumni_registration' | 'career' | 'communication' | 'engagement' | 'security' | 'admin' | 'registry_masterlist' | 'conflict_resolution';
  details: string;
  severity: 'info' | 'warning' | 'alert' | 'success';
  ipAddress?: string;
  targetRecordId?: string;
}

export interface AutomationJob {
  id: string;
  name: string;
  category: 'alumni' | 'career' | 'communication' | 'engagement' | 'security' | 'admin';
  description: string;
  lastRun: string;
  status: 'active' | 'scheduled' | 'running';
  triggerCount: number;
  frequency: string;
  nextRun: string;
}

export interface CareerSurveyResponse {
  id: string;
  uid: string;
  userName: string;
  batch: string;
  course: string;
  employmentStatus: 'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired';
  industry: string;
  jobTitle: string;
  company: string;
  relevanceToDegree: 'Directly Related' | 'Somewhat Related' | 'Not Related';
  salaryRange: string;
  milestoneAfterGraduation: '6 months' | '1 year' | '3 years' | '5 years';
  feedback: string;
  submittedAt: string;
}

export interface AlumniReportSummary {
  id: string;
  title: string;
  period: 'monthly' | 'yearly' | 'ad-hoc';
  generatedAt: string;
  totalAlumni: number;
  verifiedRate: number; // percentage e.g. 92
  employmentRate: number; // percentage e.g. 88
  topIndustries: { industry: string; count: number; percentage: number }[];
  batchDistribution: { batch: string; count: number }[];
  geographicDistribution: { region: string; count: number }[];
  activeEngagementRate: number;
}

export interface DuplicateRecordFlag {
  id: string;
  primaryUid: string;
  primaryName: string;
  potentialDuplicateUid: string;
  potentialDuplicateName: string;
  matchCriteria: 'studentId' | 'email' | 'name' | 'phone';
  confidenceScore: number; // e.g. 95
  detectedAt: string;
  status: 'open' | 'resolved' | 'dismissed';
}

export interface IncompleteRecordFlag {
  uid: string;
  name: string;
  batch?: string;
  email: string;
  missingFields: string[];
  completionPercentage: number;
  lastReminderSentAt?: string;
}

export interface JobMatchResult {
  opportunityId: string;
  title: string;
  company: string;
  matchScore: number; // 0 - 100
  matchingSkills: string[];
  courseAlignment: boolean;
  locationAlignment: boolean;
}

export interface DatabaseBackupSnapshot {
  id: string;
  timestamp: string;
  recordCount: number;
  sizeKb: number;
  status: 'completed' | 'verified' | 'restored';
  type: 'automated' | 'manual';
}



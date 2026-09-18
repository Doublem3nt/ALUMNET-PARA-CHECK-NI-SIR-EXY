import {
  UserProfile,
  FriendRequest,
  ChatThread,
  ChatMessage,
  AppNotification,
  AlumniEvent,
  Announcement,
  Opportunity,
  JobApplication,
  Chapter,
  CareerMilestone,
  GalleryItem,
  AuditLogEntry,
  AutomationJob,
  CareerSurveyResponse,
  DatabaseBackupSnapshot
} from '../types';

/**
 * Official Seed Accounts for St. Cecilia's College Deployment
 * Prepared with full credentials for every system role.
 */
export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'user_default_admin',
    name: 'Administrator',
    email: 'admin@stcecilia.edu',
    password: 'Password123!',
    role: 'admin',
    batch: '2015',
    course: 'Public Administration & Institutional Governance',
    location: 'St. Cecilia’s Campus, Administration Hall',
    profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
    headline: 'System & Alumni Relations Administrator • St. Cecilia’s College',
    about: 'Official system administrator for St. Cecilia’s College Alumni Portal. Overseeing member verification, records validation, campus event coordination, and institutional administration.',
    phone: '+63 918 987 6543',
    employeeId: 'SCC-ADM-001',
    department: 'Alumni Affairs & Institutional Advancement',
    isVerified: true,
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    experience: [
      {
        id: 'exp_adm_1',
        title: 'Director of Alumni Relations',
        company: 'St. Cecilia’s College',
        location: 'Campus Administration',
        startDate: '2018-01',
        current: true,
        description: 'Coordinating institutional engagement, alumni affairs, and scholarship foundations.'
      }
    ],
    education: [
      {
        id: 'edu_adm_1',
        degree: 'Bachelor of Science in Public Administration',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Public Administration',
        startYear: '2011',
        endYear: '2015',
        honors: 'Magna Cum Laude'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'user_default_registrar',
    name: 'College Registrar',
    email: 'registrar@stcecilia.edu',
    password: 'Password123!',
    role: 'registrar',
    batch: '2018',
    course: 'Educational Management & Academic Registry',
    location: 'St. Cecilia’s Campus, Office of the Registrar',
    profilePictureUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
    headline: 'Head College Registrar • St. Cecilia’s College',
    about: 'Lead Registrar overseeing academic credentials, commencement records, masterlist verification, and alumni diplomas for St. Cecilia’s College.',
    phone: '+63 917 888 2345',
    employeeId: 'SCC-REG-001',
    department: 'Office of the Registrar & Academic Records',
    isVerified: true,
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    experience: [
      {
        id: 'exp_reg_1',
        title: 'Head Registrar',
        company: 'St. Cecilia’s College',
        location: 'Registrar Hall',
        startDate: '2019-06',
        current: true,
        description: 'Managing student archives, alumni diplomas, graduation certifications, and campus registry.'
      }
    ],
    education: [
      {
        id: 'edu_reg_1',
        degree: 'Bachelor of Science in Education & Records Administration',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Education',
        startYear: '2014',
        endYear: '2018',
        honors: 'Cum Laude'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'user_default_alumni',
    name: 'Juan Dela Cruz',
    email: 'alumni@stcecilia.edu',
    password: 'Password123!',
    role: 'alumni',
    batch: '2024',
    course: 'B.S. Information Technology',
    location: 'Cebu, Philippines',
    profilePictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80',
    headline: 'Junior Software Associate • St. Cecilia’s Alumnus',
    about: 'Proud alumnus of St. Cecilia’s College, Class of 2024. Interested in software engineering, cloud computing, and staying connected with batchmates and mentors.',
    phone: '+63 917 123 4567',
    studentId: 'SCC-2020-0192',
    isVerified: true,
    skills: ['TypeScript', 'React', 'JavaScript', 'REST APIs', 'SQL', 'Git'],
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    experience: [
      {
        id: 'exp_jdc_1',
        title: 'Junior Software Engineer',
        company: 'Tech Solutions Philippines',
        location: 'Cebu IT Park',
        startDate: '2024-07',
        current: true,
        description: 'Building modern responsive web interfaces and cloud-native backend services.'
      }
    ],
    education: [
      {
        id: 'edu_jdc_1',
        degree: 'Bachelor of Science in Information Technology',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Information Technology',
        startYear: '2020',
        endYear: '2024',
        honors: 'Dean’s Lister, Best Capstone Project'
      }
    ],
    createdAt: '2024-06-15T00:00:00.000Z'
  },
  {
    uid: 'user_default_employer',
    name: 'Partner Employer',
    email: 'employer@stcecilia.edu',
    password: 'Password123!',
    role: 'employer',
    company: 'Tech Solutions Philippines',
    location: 'Cebu IT Park, Cebu City',
    profilePictureUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    headline: 'Talent Acquisition Manager • Tech Solutions Philippines',
    about: 'Official industry hiring partner connecting with St. Cecilia’s College for graduate recruitment, internship placement, and career development.',
    phone: '+63 918 555 7890',
    employeeId: 'SCC-EMP-001',
    department: 'Human Resources & Corporate Recruitment',
    isVerified: true,
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    experience: [
      {
        id: 'exp_emp_1',
        title: 'Head of Talent Acquisition',
        company: 'Tech Solutions Philippines',
        location: 'Cebu City',
        startDate: '2020-03',
        current: true,
        description: 'Connecting top academic talent and graduates with engineering roles.'
      }
    ],
    education: [],
    createdAt: '2024-01-10T00:00:00.000Z'
  },
  {
    uid: 'user_default_staff',
    name: 'College Staff',
    email: 'staff@stcecilia.edu',
    password: 'Password123!',
    role: 'staff',
    batch: '2012',
    course: 'Information Technology & Education',
    location: 'St. Cecilia’s Campus, Academic Hall',
    profilePictureUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
    headline: 'Faculty Coordinator • St. Cecilia’s College',
    about: 'Faculty coordinator dedicated to collegiate academic excellence, student capstone mentoring, and alumni connections.',
    phone: '+63 919 666 4321',
    employeeId: 'SCC-STAFF-001',
    department: 'College of Computer Studies',
    isVerified: true,
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    experience: [
      {
        id: 'exp_staff_1',
        title: 'Senior Faculty Instructor',
        company: 'St. Cecilia’s College',
        location: 'Main Campus',
        startDate: '2016-08',
        current: true,
        description: 'Delivering courses in software development, data structures, and collegiate ethics.'
      }
    ],
    education: [],
    createdAt: '2024-01-05T00:00:00.000Z'
  },
  {
    uid: 'user_default_student',
    name: 'Senior Student',
    email: 'student@stcecilia.edu',
    password: 'Password123!',
    role: 'student',
    batch: '2026',
    course: 'B.S. Information Technology',
    location: 'St. Cecilia’s Campus, Cebu',
    profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    headline: 'Graduating Senior • St. Cecilia’s College',
    about: 'Graduating senior preparing for capstone completion, internship placement, and transition to the St. Cecilia’s College Alumni Association.',
    phone: '+63 920 777 8899',
    studentId: 'SCC-2022-0104',
    isVerified: true,
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    experience: [],
    education: [
      {
        id: 'edu_stud_1',
        degree: 'Bachelor of Science in Information Technology',
        institution: 'St. Cecilia’s College',
        fieldOfStudy: 'Information Technology',
        startYear: '2022',
        endYear: '2026',
        honors: 'Dean’s Lister Candidate'
      }
    ],
    createdAt: '2024-08-01T00:00:00.000Z'
  },
  {
    uid: 'user_default_moderator',
    name: 'Community Moderator',
    email: 'moderator@stcecilia.edu',
    password: 'Password123!',
    role: 'moderator',
    location: 'St. Cecilia’s Campus, Administration Hall',
    profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80',
    headline: 'Community & Forum Moderator • St. Cecilia’s College',
    about: 'Ensuring safe, collegiate, and professional networking across all St. Cecilia’s College alumni channels.',
    phone: '+63 921 444 3322',
    employeeId: 'SCC-MOD-001',
    department: 'Student Affairs & Alumni Communications',
    isVerified: true,
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    experience: [],
    education: [],
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [];
export const INITIAL_CHATS: ChatThread[] = [
  {
    id: 'chat_event_evt_grand_homecoming_2026',
    memberIds: ['user_default_admin', 'user_default_alumni'],
    lastMessage: 'Juan Dela Cruz joined the event group chat (Attending).',
    lastMessageAt: new Date().toISOString(),
    unreadCount: { user_default_admin: 0, user_default_alumni: 0 },
    isGroupChat: true,
    groupName: "Grand Alumni Homecoming 2026 – Official Group Chat",
    groupDescription: "Official coordination and peer networking chat for the Grand Alumni Homecoming & Fellowship at St. Cecilia's College.",
    eventId: 'evt_grand_homecoming_2026',
    isEventChat: true,
    adminUids: ['user_default_admin']
  }
];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  chat_event_evt_grand_homecoming_2026: [
    {
      id: 'msg_evt_welcome_init_1',
      chatId: 'chat_event_evt_grand_homecoming_2026',
      senderId: 'user_default_admin',
      senderName: 'Administrator',
      senderRole: 'admin',
      text: 'Welcome to the official event group chat for St. Cecilia’s College Grand Alumni Homecoming & Fellowship! All attendees who RSVP are automatically added to this conversation.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      isSystemMessage: true
    },
    {
      id: 'msg_evt_welcome_init_2',
      chatId: 'chat_event_evt_grand_homecoming_2026',
      senderId: 'user_default_alumni',
      senderName: 'Juan Dela Cruz',
      senderRole: 'alumni',
      text: 'Hello everyone! Really excited to meet all fellow Cecilians and batchmates at the Main Campus Complex.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ]
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_welcome_system',
    toUid: 'user_default_alumni',
    fromUid: 'user_default_admin',
    type: 'announcement',
    title: 'Welcome to St. Cecilia’s Alumni Portal',
    body: 'Welcome! Your official St. Cecilia’s College alumni profile and digital ID pass have been successfully provisioned.',
    createdAt: new Date().toISOString(),
    read: false
  }
];

export const INITIAL_EVENTS: AlumniEvent[] = [
  {
    id: 'evt_grand_homecoming_2026',
    title: 'St. Cecilia’s College Grand Alumni Homecoming & Fellowship',
    description: 'Join fellow Cecilians for an inspiring evening of reunion, networking, and celebration of institutional milestones at the St. Cecilia’s College Main Campus.',
    location: 'St. Cecilia’s College Main Campus Complex, Cebu',
    type: 'reunion',
    startDate: '2026-11-21T18:00:00.000Z',
    endDate: '2026-11-21T22:00:00.000Z',
    heroImageUrl: '/assets/landing-building-2.jpg',
    isVirtual: false,
    isImportant: true,
    maxAttendees: 1200,
    attendeesCount: 2,
    groupChatId: 'chat_event_evt_grand_homecoming_2026',
    createdBy: 'user_default_admin',
    createdByName: 'St. Cecilia’s College Alumni Association',
    attendees: [
      {
        uid: 'user_default_admin',
        name: 'Administrator',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        role: 'admin',
        status: 'going',
        rsvpDate: new Date().toISOString()
      },
      {
        uid: 'user_default_alumni',
        name: 'Juan Dela Cruz',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        batch: '2024',
        course: 'B.S. Information Technology',
        role: 'alumni',
        status: 'going',
        rsvpDate: new Date().toISOString()
      }
    ],
    likes: ['user_default_admin', 'user_default_alumni'],
    comments: [
      {
        id: 'evt_c_1',
        eventId: 'evt_grand_homecoming_2026',
        authorId: 'user_default_admin',
        authorName: 'Administrator',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        text: 'Welcome back home, Cecilians! Registration tables and Digital ID scanning will open at 4:30 PM.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ]
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_official_launch',
    title: 'Official Launch of the St. Cecilia’s College Alumni Network Portal',
    content: 'The Office of Alumni Affairs and College Registrar proudly presents our centralized digital portal. Verified alumni can now access their digital ID cards, reconnect with peers, discover career opportunities, and register for campus events.',
    category: 'institutional',
    important: true,
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdBy: 'user_default_admin',
    authorName: 'St. Cecilia’s College Administration',
    authorRole: 'admin'
  }
];

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'job_tech_dev_1',
    title: 'Junior Software Engineer (Full-Time)',
    company: 'Tech Solutions Philippines',
    location: 'Cebu IT Park, Cebu City (Hybrid)',
    type: 'Full-time',
    description: 'We are seeking passionate St. Cecilia’s College computer science and IT graduates to join our software engineering team. You will build modern web applications and scalable cloud backends.',
    salaryOrStipend: '₱35,000 - ₱45,000 / month',
    skills: ['JavaScript', 'TypeScript', 'React', 'REST APIs', 'Git'],
    requiredCourse: 'BS Information Technology',
    experienceLevel: 'Fresh Graduate',
    postedBy: 'user_default_employer',
    posterName: 'Partner Employer',
    posterRole: 'employer',
    contactEmail: 'careers@techsolutions.ph',
    status: 'active',
    approvalStatus: 'approved',
    howToApply: 'both',
    applicationsCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'job_qa_cloud_2',
    title: 'QA & Database Support Associate',
    company: 'Cebu Innovation Cloud Labs',
    location: 'Cebu City (On-site)',
    type: 'Full-time',
    description: 'Entry-level opportunity for graduates skilled in database queries, SQL scripting, testing protocols, and automated CI pipelines.',
    salaryOrStipend: '₱28,000 - ₱36,000 / month',
    skills: ['SQL', 'Git', 'Manual Testing', 'API Testing'],
    requiredCourse: 'BS Information Technology',
    experienceLevel: 'Fresh Graduate',
    postedBy: 'user_default_employer',
    posterName: 'Partner Employer',
    posterRole: 'employer',
    contactEmail: 'talent@cebucloudlabs.com',
    status: 'active',
    approvalStatus: 'approved',
    howToApply: 'both',
    applicationsCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'job_marketing_growth_3',
    title: 'Digital Marketing & Community Coordinator',
    company: 'St. Cecilia’s Global Ventures',
    location: 'Minglanilla, Cebu (Hybrid)',
    type: 'Full-time',
    description: 'Drive social media growth, employer branding, and digital campaigns for our partner business networks across Visayas.',
    salaryOrStipend: '₱24,000 - ₱30,000 / month',
    skills: ['Digital Marketing', 'Social Media Management', 'Copywriting', 'SEO'],
    requiredCourse: 'BS Business Administration',
    experienceLevel: 'Fresh Graduate / 1 Year',
    postedBy: 'user_default_admin',
    posterName: 'Administrator',
    posterRole: 'admin',
    contactEmail: 'ventures@stcecilia.edu',
    status: 'active',
    approvalStatus: 'approved',
    howToApply: 'both',
    applicationsCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

export const INITIAL_JOB_APPLICATIONS: JobApplication[] = [];

export const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: 'chap_cebu',
    name: 'St. Cecilia’s College - Cebu Mother Chapter',
    region: 'Cebu Province & Central Visayas',
    leadName: 'Juan Dela Cruz',
    leadEmail: 'alumni@stcecilia.edu',
    memberCount: 1,
    meetingFrequency: 'Monthly',
    description: 'Official mother chapter centered in Cebu, coordinating local fellowships, community projects, and campus homecoming activities.'
  },
  {
    id: 'chap_global',
    name: 'St. Cecilia’s Global Alumni Chapter',
    region: 'National & Overseas Alumni',
    leadName: 'Administrator',
    leadEmail: 'admin@stcecilia.edu',
    memberCount: 1,
    meetingFrequency: 'Quarterly',
    description: 'Connecting St. Cecilia’s College graduates practicing across the Philippines and worldwide.'
  }
];

export const INITIAL_MILESTONES: CareerMilestone[] = [];

export const INITIAL_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal_1',
    category: 'campus',
    title: 'St. Cecilia’s Modern Academic Tower',
    year: '2026',
    url: '/assets/landing-building-1.jpg',
    description: 'Towering modern architecture and academic complex of St. Cecilia’s College.',
    uploadedBy: 'user_default_admin',
    uploadedByName: 'Administrator',
    uploaderRole: 'admin',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'gal_2',
    category: 'campus',
    title: 'St. Cecilia’s College Main Building & Canopy',
    year: '2026',
    url: '/assets/landing-building-2.jpg',
    description: 'Official main campus building featuring the iconic red entrance canopy and administrative offices.',
    uploadedBy: 'user_default_admin',
    uploadedByName: 'Administrator',
    uploaderRole: 'admin',
    createdAt: '2026-02-15T09:30:00.000Z'
  },
  {
    id: 'gal_3',
    category: 'campus',
    title: 'St. Cecilia’s Institutional Complex',
    year: '2026',
    url: '/assets/landing-building-3.jpg',
    description: 'Academic facilities, collegiate learning grounds, and campus infrastructure.',
    uploadedBy: 'user_default_admin',
    uploadedByName: 'Administrator',
    uploaderRole: 'admin',
    createdAt: '2026-02-20T14:15:00.000Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_deploy_init',
    timestamp: new Date().toISOString(),
    action: 'System Initialized for Production',
    actorId: 'user_default_admin',
    actorName: 'Administrator',
    actorRole: 'admin',
    category: 'admin',
    details: 'St. Cecilia’s College Alumni Portal initialized for production deployment. Role accounts verified.',
    severity: 'success',
    ipAddress: '127.0.0.1'
  }
];

export const INITIAL_AUTOMATION_JOBS: AutomationJob[] = [
  {
    id: 'job_reg_verifier',
    name: 'Automatic Alumni Registrar Verification & Approval',
    category: 'alumni',
    description: 'Matches incoming registrations against accredited St. Cecilia’s College registrar records and auto-approves verified graduates.',
    lastRun: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'active',
    triggerCount: 1,
    frequency: 'Instant / Event-Driven',
    nextRun: 'Listening on new registration'
  },
  {
    id: 'job_birthday_greeter',
    name: 'Alumni Birthday & Anniversary Greeting Automation',
    category: 'engagement',
    description: 'Scans alumni birthdays and graduation milestones daily at 08:00 AM PHT and sends celebration notices.',
    lastRun: new Date(Date.now() - 3600000 * 14).toISOString(),
    status: 'active',
    triggerCount: 0,
    frequency: 'Daily at 08:00 AM PHT',
    nextRun: new Date(Date.now() + 3600000 * 10).toISOString()
  },
  {
    id: 'job_profile_completer',
    name: 'Missing Profile & Employment Update Reminders',
    category: 'alumni',
    description: 'Identifies accounts with missing employment data and delivers automated completion prompts.',
    lastRun: new Date(Date.now() - 3600000 * 26).toISOString(),
    status: 'active',
    triggerCount: 0,
    frequency: 'Weekly on Mondays',
    nextRun: new Date(Date.now() + 3600000 * 48).toISOString()
  }
];

export const INITIAL_CAREER_SURVEYS: CareerSurveyResponse[] = [];
export const INITIAL_BACKUPS: DatabaseBackupSnapshot[] = [];

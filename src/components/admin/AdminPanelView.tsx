import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Award,
  MapPin,
  Building,
  Building2,
  Plus,
  Trash2,
  Calendar,
  Megaphone,
  Briefcase,
  Search,
  Filter,
  BarChart3,
  Sparkles,
  ShieldAlert,
  Lock,
  Upload,
  Image as ImageIcon,
  UserPlus,
  Shield,
  Bot,
  GraduationCap,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  Landmark,
  Database,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserRole } from '../../types';
import { AdminAutomationDashboard } from './AdminAutomationDashboard';
import { RegistrarRegistryMatcher } from './RegistrarRegistryMatcher';
import { AdminConflictResolutionView } from './AdminConflictResolutionView';
import { AuditLogView } from './AuditLogView';
import { JobModerationQueue } from '../opportunities/JobModerationQueue';
import { EmployerManagementModule } from './EmployerManagementModule';
import { getRegistrationConflicts } from '../../services/studentVerificationService';

export const AdminPanelView: React.FC = () => {
  const {
    currentUser,
    users,
    chapters,
    createChapter,
    milestones,
    createMilestone,
    setUserRole,
    setUserVerified,
    permissions,
    setSelectedUserIdForModal,
    createUserByAdmin,
    deleteAlumni,
    galleryItems,
    addGalleryItem,
    deleteGalleryItem,
    automationJobs,
    auditLogs,
    opportunities,
    syncAllDataToCloud,
    isFirestoreSyncing
  } = useAlumni();

  const [activeTab, setActiveTab] = useState<'users' | 'registry' | 'conflicts' | 'employers' | 'jobs' | 'audit' | 'automations' | 'metrics' | 'milestones' | 'chapters' | 'gallery'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Compute pending conflicts count for badge
  const pendingConflictsCount = useMemo(() => {
    try {
      return getRegistrationConflicts().filter((c) => c.status === 'pending').length;
    } catch {
      return 0;
    }
  }, [activeTab]);

  // Compute pending jobs and employers count for badge
  const pendingJobsCount = useMemo(() => {
    return (opportunities || []).filter((o) => o.status === 'pending_approval').length;
  }, [opportunities]);

  const pendingEmployersCount = useMemo(() => {
    return (users || []).filter((u) => u.role === 'employer' && u.employerVerificationStatus === 'pending_verification').length;
  }, [users]);

  const totalCareerModerationPending = pendingJobsCount + pendingEmployersCount;

  // Provision User Modal (Admin only creates admin/staff accounts)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Password123!');
  const [newUserRole, setNewUserRole] = useState<UserRole>('admin');
  const [newUserDepartment, setNewUserDepartment] = useState('');

  // Gallery Upload Modal (Admin & Registrar)
  const [showGalleryUploadModal, setShowGalleryUploadModal] = useState(false);
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState<'campus' | 'homecoming' | 'commencement' | 'heritage'>('campus');
  const [galYear, setGalYear] = useState('2026');
  const [galUrl, setGalUrl] = useState('');
  const [galDesc, setGalDesc] = useState('');

  // Milestone Form
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [mAlumnusId, setMAlumnusId] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mCategory, setMCategory] = useState<'promotion' | 'startup' | 'award' | 'publication' | 'honor'>('promotion');
  const [mDescription, setMDescription] = useState('');
  const [mCompany, setMCompany] = useState('');

  // Chapter Form
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cRegion, setCRegion] = useState('');
  const [cLeadName, setCLeadName] = useState('');
  const [cLeadEmail, setCLeadEmail] = useState('');

  // Permission Gate
  if (!permissions.canAccessAdminPanel) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-stone-900">Restricted Administration Portal</h2>
        <p className="text-xs text-stone-500 mt-2 leading-relaxed">
          Your current account role is <span className="font-bold text-stone-800 uppercase">{currentUser?.role}</span>.
          Access to this management console requires Admin, Registrar, Staff, or Moderator privileges.
        </p>
        <p className="text-xs text-stone-400 mt-3">
          To access institutional governance and academic records, sign in with an Administrator or Registrar credential.
        </p>
      </div>
    );
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase();
      const matchesSearch =
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.course || '').toLowerCase().includes(q) ||
        (u.batch || '').includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, roleFilter]);

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const alumnus = users.find((u) => u.uid === mAlumnusId) || users[0];
    if (!alumnus || !mTitle || !mDescription) return;

    createMilestone({
      alumnusId: alumnus.uid,
      alumnusName: alumnus.name,
      alumnusAvatar: alumnus.profilePictureUrl,
      title: mTitle,
      category: mCategory,
      description: mDescription,
      companyOrOrg: mCompany || undefined
    });

    setMTitle('');
    setMDescription('');
    setMCompany('');
    setShowMilestoneModal(false);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cRegion || !cLeadName) return;

    createChapter({
      name: cName,
      region: cRegion,
      leadName: cLeadName,
      leadEmail: cLeadEmail || 'chapter@alumni.edu'
    });

    setCName('');
    setCRegion('');
    setCLeadName('');
    setCLeadEmail('');
    setShowChapterModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Alumni Association Administration
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-purple-100 text-purple-800 rounded uppercase">
                  {currentUser?.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Verify degrees, manage member roles, celebrate alumni milestones, and oversee regional chapters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => syncAllDataToCloud()}
              disabled={isFirestoreSyncing}
              title="Push all local alumni records, events, announcements, jobs, and student registry directly to Firestore Cloud Database"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isFirestoreSyncing ? 'animate-spin' : ''}`} />
              <span>{isFirestoreSyncing ? 'Pushing to Firestore...' : 'Sync to Firestore'}</span>
            </button>

            {permissions.canAssignRoles && (
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision Account</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Administration Layout: Sidebar Navigation + Center Display */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 bg-white rounded-2xl border border-stone-200 shadow-2xs p-4 space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3">
              Management Modules
            </span>
            <nav className="mt-2 space-y-1">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'users'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-white' : 'text-stone-500'}`} />
                  <span>Members & Roles</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {users.length}
                </span>
              </button>

              {permissions.canAccessRegistry && (
                <button
                  onClick={() => setActiveTab('registry')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'registry'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className={`w-4 h-4 ${activeTab === 'registry' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Registry Matcher</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      activeTab === 'registry' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    CSV/Excel
                  </span>
                </button>
              )}

              {permissions.canAccessConflictResolution && (
                <button
                  onClick={() => setActiveTab('conflicts')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'conflicts'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className={`w-4 h-4 ${activeTab === 'conflicts' ? 'text-white' : 'text-amber-500'}`} />
                    <span>Conflict Resolution</span>
                  </div>
                  {pendingConflictsCount > 0 ? (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        activeTab === 'conflicts' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {pendingConflictsCount} Pending
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        activeTab === 'conflicts' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Clear
                    </span>
                  )}
                </button>
              )}

              {permissions.canManageJobModeration && (
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'jobs'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className={`w-4 h-4 ${activeTab === 'jobs' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Job & Employer Moderation</span>
                  </div>
                  {totalCareerModerationPending > 0 ? (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {totalCareerModerationPending} Pending
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Active
                    </span>
                  )}
                </button>
              )}

              {permissions.canAccessEmployerAccreditation && (
                <button
                  onClick={() => setActiveTab('employers')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'employers'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className={`w-4 h-4 ${activeTab === 'employers' ? 'text-white' : 'text-emerald-600'}`} />
                    <span>Employer Accreditations</span>
                  </div>
                  {pendingEmployersCount > 0 ? (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        activeTab === 'employers' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {pendingEmployersCount} Pending
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        activeTab === 'employers' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      Accredited
                    </span>
                  )}
                </button>
              )}

              {permissions.canAccessAuditTrails && (
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'audit'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className={`w-4 h-4 ${activeTab === 'audit' ? 'text-white' : 'text-stone-500'}`} />
                    <span>Audit Trail & Records</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      activeTab === 'audit' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {auditLogs.length}
                  </span>
                </button>
              )}

              {permissions.canAccessAutomations && (
                <button
                  onClick={() => setActiveTab('automations')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'automations'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className={`w-4 h-4 ${activeTab === 'automations' ? 'text-white' : 'text-stone-500'}`} />
                    <span>Automations & Ops</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      activeTab === 'automations' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {automationJobs.length} Jobs
                  </span>
                </button>
              )}

              {permissions.canAccessGrowthAnalytics && (
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'metrics'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className={`w-4 h-4 ${activeTab === 'metrics' ? 'text-white' : 'text-stone-500'}`} />
                    <span>Growth Analytics</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      activeTab === 'metrics' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    Live
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('milestones')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'milestones'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className={`w-4 h-4 ${activeTab === 'milestones' ? 'text-white' : 'text-stone-500'}`} />
                  <span>Milestones & Awards</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    activeTab === 'milestones' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {milestones.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('chapters')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'chapters'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className={`w-4 h-4 ${activeTab === 'chapters' ? 'text-white' : 'text-stone-500'}`} />
                  <span>Regional Chapters</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    activeTab === 'chapters' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {chapters.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className={`w-4 h-4 ${activeTab === 'gallery' ? 'text-white' : 'text-stone-500'}`} />
                  <span>Campus Gallery</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    activeTab === 'gallery' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {galleryItems.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Quick Actions in Sidebar */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3">
              Quick Actions
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => setShowMilestoneModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Publish Milestone</span>
              </button>
              <button
                onClick={() => setShowChapterModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Establish Chapter</span>
              </button>
              <button
                onClick={() => setShowGalleryUploadModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Add Gallery Photo</span>
              </button>
            </div>
          </div>

          {/* Institutional Stats Pill */}
          <div className="pt-3 border-t border-stone-100">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                <span className="text-sm font-extrabold text-stone-900 block">{users.length}</span>
                <span className="text-[9px] text-stone-500 uppercase font-bold">Total Roster</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <span className="text-sm font-extrabold text-emerald-800 block">
                  {users.filter((u) => u.isVerified).length}
                </span>
                <span className="text-[9px] text-emerald-700 uppercase font-bold">Verified</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Display Area */}
        <div className="flex-1 min-w-0 w-full space-y-4">

      {/* TAB: REGISTRAR REGISTRY MATCHER & CSV/EXCEL UPLOADER */}
      {activeTab === 'registry' && (
        permissions.canAccessRegistry ? (
          <RegistrarRegistryMatcher />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Access Restricted: Student Registry</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Your assigned role (<strong>{currentUser?.role?.toUpperCase()}</strong>) does not have authorization to access the Official Student Registry or Upload Masterlists. This module is restricted to Registrars and System Administrators.
            </p>
          </div>
        )
      )}

      {/* TAB: REGISTRATION CONFLICT & DUPLICATE RESOLUTION */}
      {activeTab === 'conflicts' && (
        permissions.canAccessConflictResolution ? (
          <AdminConflictResolutionView />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Access Restricted: Conflict Resolution</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Conflict and duplicate identity resolutions require Registrar or Administrator credentials.
            </p>
          </div>
        )
      )}

      {/* TAB: CAREER & JOB POST MODERATION QUEUE */}
      {activeTab === 'jobs' && (
        permissions.canManageJobModeration ? (
          <JobModerationQueue />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Access Restricted: Job Moderation</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Career listings moderation is restricted to authorized moderators and administrators.
            </p>
          </div>
        )
      )}

      {/* TAB: EMPLOYER PARTNER & COMPANY ACCREDITATIONS */}
      {activeTab === 'employers' && (
        permissions.canAccessEmployerAccreditation ? (
          <EmployerManagementModule />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Access Restricted: Employer Accreditations</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Accreditation of corporate partners and employer hiring privileges is reserved for College Administration.
            </p>
          </div>
        )
      )}

      {/* TAB: AUDIT LOG & COMPLIANCE TRAIL */}
      {activeTab === 'audit' && (
        permissions.canAccessAuditTrails ? (
          <AuditLogView />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Access Restricted: Audit Trails</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Institutional audit logs and security event trails are protected and viewable by Administrators only.
            </p>
          </div>
        )
      )}

      {/* TAB: AUTOMATIONS & SYSTEM OPS */}
      {activeTab === 'automations' && (
        permissions.canAccessAutomations ? (
          <AdminAutomationDashboard />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Access Restricted: System Automations</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              System cron jobs, backup configurations, and automated communications are reserved for Administrators.
            </p>
          </div>
        )
      )}

      {/* TAB 1: USER VERIFICATION & ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Filter by name, email, course, or batch..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 flex-1 sm:flex-initial"
              >
                <option value="all">All Roles</option>
                <option value="alumni">Alumni</option>
                <option value="admin">Admin</option>
                <option value="registrar">Registrar</option>
                <option value="staff">Staff</option>
                <option value="moderator">Moderator</option>
              </select>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-3.5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Provision Account</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Batch & Course</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => setSelectedUserIdForModal(u.uid)}
                        >
                          <img
                            src={u.profilePictureUrl}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-stone-200"
                          />
                          <div>
                            <span className="font-bold text-stone-900 block hover:text-blue-600">
                              {u.name}
                            </span>
                            <span className="text-[11px] text-stone-400">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-stone-600">
                        <span className="font-semibold text-blue-700">Batch {u.batch}</span>
                        <span className="block text-[11px] text-stone-400">{u.course}</span>
                      </td>

                      <td className="px-4 py-3">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 uppercase text-[10px] font-bold px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-200 select-none shadow-2xs"
                          title="Assigned roles are permanent and immutable. Even administrators cannot modify user roles."
                        >
                          <Lock className="w-3 h-3 text-stone-400" />
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right space-x-2">
                        {permissions.canVerifyAlumni && (
                          <button
                            onClick={() => setUserVerified(u.uid, !u.isVerified)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              u.isVerified
                                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                            }`}
                          >
                            {u.isVerified ? 'Revoke' : 'Verify'}
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedUserIdForModal(u.uid)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] font-medium"
                        >
                          View
                        </button>

                        {permissions.canAccessAdminPanel && u.uid !== currentUser?.uid && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${u.name} from the alumni directory? This action cannot be undone.`)) {
                                deleteAlumni(u.uid);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            title="Delete alumnus from directory"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GROWTH ANALYTICS */}
      {activeTab === 'metrics' && (
        permissions.canAccessGrowthAnalytics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Total Alumni Database
                </span>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">85,420</div>
                <p className="text-xs text-emerald-600 font-semibold mt-1">↑ +8.4% annual growth</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Verified Degrees
                </span>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">94.2%</div>
                <p className="text-xs text-blue-600 font-semibold mt-1">Cross-checked by Registrar</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Active Chapter Cities
                </span>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">{chapters.length} Hubs</div>
                <p className="text-xs text-purple-600 font-semibold mt-1">Global outreach</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <h3 className="text-sm font-bold text-stone-900 mb-4">Graduation Batch Distribution</h3>
              <div className="space-y-3">
                {[
                  { batch: '2020 - 2025 (Young Alumni)', count: 24500, percent: 38 },
                  { batch: '2015 - 2019 (Mid-Career Leaders)', count: 21200, percent: 32 },
                  { batch: '2010 - 2014 (Established Executives)', count: 16800, percent: 20 },
                  { batch: '2000 - 2009 (Senior Alumni & Founders)', count: 14920, percent: 10 }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                      <span>{item.batch}</span>
                      <span>
                        {item.count.toLocaleString()} ({item.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percent * 2.5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Access Restricted: Growth Analytics</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Institutional demographic reports, database growth trends, and retention analytics are reserved for University Administration.
            </p>
          </div>
        )
      )}

      {/* TAB 3: MILESTONES & AWARDS */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Alumni Career Milestones</h2>
              <p className="text-xs text-stone-500">
                Celebrate member promotions, startup fundraises, patents, and civic honors.
              </p>
            </div>

            <button
              onClick={() => setShowMilestoneModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Milestone</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={m.alumnusAvatar}
                    alt={m.alumnusName}
                    className="w-12 h-12 rounded-full object-cover border border-stone-200"
                  />
                  <div>
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {m.category}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 mt-1">{m.title}</h4>
                    <p className="text-xs text-stone-500 font-medium">
                      {m.alumnusName} {m.companyOrOrg ? `• ${m.companyOrOrg}` : ''}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-stone-600 mt-3 leading-relaxed">{m.description}</p>

                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                  Published on {new Date(m.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REGIONAL CHAPTERS */}
      {activeTab === 'chapters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Regional Alumni Chapters</h2>
              <p className="text-xs text-stone-500">
                Official alumni chapters organizing local meetups and reunions around the globe.
              </p>
            </div>

            {permissions.canManageChapters && (
              <button
                onClick={() => setShowChapterModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Establish Chapter</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {ch.region}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 mt-2">{ch.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>{ch.memberCount.toLocaleString()} members</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 text-xs">
                  <span className="text-stone-400 block text-[11px]">Chapter President:</span>
                  <span className="font-semibold text-stone-800">{ch.leadName}</span>
                  <a
                    href={`mailto:${ch.leadEmail}`}
                    className="text-[11px] text-blue-600 hover:underline block truncate mt-0.5"
                  >
                    {ch.leadEmail}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MILESTONE MODAL */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Publish Alumni Milestone</h3>
              <button onClick={() => setShowMilestoneModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="mt-3 space-y-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Select Alumnus *</label>
                <select
                  value={mAlumnusId}
                  onChange={(e) => setMAlumnusId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
                >
                  <option value="">Choose alumnus...</option>
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} (Batch {u.batch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Category</label>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
                >
                  <option value="promotion">Executive Promotion</option>
                  <option value="startup">Startup Founding & Funding</option>
                  <option value="award">Industry / Civic Award</option>
                  <option value="publication">Research Publication / Patent</option>
                  <option value="honor">Distinguished University Honor</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Milestone Headline *</label>
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="e.g. Appointed Chief Technology Officer"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={mCompany}
                  onChange={(e) => setMCompany(e.target.value)}
                  placeholder="e.g. Tesla, Stripe, Stanford"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description / Story *</label>
                <textarea
                  rows={3}
                  required
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  placeholder="Share details of the achievement..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-3 py-1.5 bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg shadow-xs"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAPTER MODAL */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Establish Regional Chapter</h3>
              <button onClick={() => setShowChapterModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="mt-3 space-y-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Chapter Name *</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Austin Regional Chapter"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Region / Geographic Area *</label>
                <input
                  type="text"
                  required
                  value={cRegion}
                  onChange={(e) => setCRegion(e.target.value)}
                  placeholder="e.g. Texas, USA"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Chapter President / Lead Name *</label>
                <input
                  type="text"
                  required
                  value={cLeadName}
                  onChange={(e) => setCLeadName(e.target.value)}
                  placeholder="Alum Lead Name"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Lead Contact Email</label>
                <input
                  type="email"
                  value={cLeadEmail}
                  onChange={(e) => setCLeadEmail(e.target.value)}
                  placeholder="lead@alumni.edu"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-3 py-1.5 bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg shadow-xs"
                >
                  Charter Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: CAMPUS & HERITAGE GALLERY MANAGEMENT */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">Campus & Heritage Gallery Curation</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-[#991B1B]">
                  Admin & Registrar Only
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Upload historical archives, commencement exercises, reunion ceremonies, and campus facilities.
              </p>
            </div>

            {permissions.canUploadGallery && (
              <button
                onClick={() => setShowGalleryUploadModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Archival Photo</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/70 text-white backdrop-blur-xs">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#991B1B] text-white">
                        {item.year}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5">
                    <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="p-3.5 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between text-[10px] text-stone-400">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#991B1B]" />
                    <span className="truncate">
                      By {item.uploadedByName || 'Institution'} ({item.uploaderRole || 'admin'})
                    </span>
                  </div>

                  {permissions.canUploadGallery && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${item.title}"?`)) {
                          deleteGalleryItem(item.id);
                        }
                      }}
                      className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* PROVISION USER MODAL (Admin Only) */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 text-[#991B1B] rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Provision University Account</h3>
                  <p className="text-[11px] text-stone-500">Administrator-exclusive provisioning</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUserName.trim() || !newUserEmail.trim()) return;
                createUserByAdmin({
                  name: newUserName.trim(),
                  email: newUserEmail.trim(),
                  password: newUserPassword || 'Password123!',
                  role: newUserRole,
                  department: newUserDepartment.trim() || undefined
                });
                setNewUserName('');
                setNewUserEmail('');
                setNewUserDepartment('');
                setShowCreateUserModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-stone-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="name@stcecilia.edu"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Role Permission *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-semibold text-stone-800"
                  >
                    <option value="admin">Admin (System Governance)</option>
                    <option value="registrar">Registrar (Academic Records)</option>
                    <option value="staff">Staff (Institutional Services)</option>
                    <option value="moderator">Moderator (Community)</option>
                    <option value="alumni">Alumni (Graduate Member)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Department / Office</label>
                <input
                  type="text"
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  placeholder="e.g. Office of Institutional Advancement"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-stone-500">
                Notice: Accounts created here are automatically verified and granted immediate access according to the selected institutional role.
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-3.5 py-1.5 bg-stone-100 text-stone-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold rounded-lg shadow-xs"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY UPLOAD MODAL IN ADMIN PANEL (Admin & Registrar) */}
      {showGalleryUploadModal && permissions.canUploadGallery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 text-[#991B1B] rounded-lg">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Upload to Campus & Heritage Gallery</h3>
                  <p className="text-[11px] text-stone-500">Authorized as {currentUser?.role?.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setShowGalleryUploadModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!galTitle.trim() || !galUrl.trim()) return;
                addGalleryItem({
                  title: galTitle.trim(),
                  category: galCategory,
                  year: galYear.trim() || '2026',
                  url: galUrl.trim(),
                  description: galDesc.trim() || undefined
                });
                setGalTitle('');
                setGalUrl('');
                setGalDesc('');
                setShowGalleryUploadModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-stone-700 block mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="e.g. Quadrangle Heritage Arbor"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category *</label>
                  <select
                    value={galCategory}
                    onChange={(e) => setGalCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  >
                    <option value="campus">Campus & Facilities</option>
                    <option value="commencement">Commencement & Honors</option>
                    <option value="homecoming">Homecoming & Gala</option>
                    <option value="heritage">Heritage Archives</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Year / Era *</label>
                  <input
                    type="text"
                    required
                    value={galYear}
                    onChange={(e) => setGalYear(e.target.value)}
                    placeholder="e.g. 2026 or Batch 2024"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={galUrl}
                  onChange={(e) => setGalUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Description / Historical Notes</label>
                <textarea
                  rows={2}
                  value={galDesc}
                  onChange={(e) => setGalDesc(e.target.value)}
                  placeholder="Brief archival notes or commencement honors..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg resize-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGalleryUploadModal(false)}
                  className="px-3.5 py-1.5 bg-stone-100 text-stone-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold rounded-lg shadow-xs"
                >
                  Publish Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

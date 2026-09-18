import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Calendar,
  BookOpen,
  MapPin,
  Briefcase,
  UserCheck,
  Check,
  X,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Megaphone,
  Compass,
  Building2,
  Clock,
  Heart,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Award,
  SlidersHorizontal,
  Bell,
  GraduationCap
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { filterAnnouncementsForUser, calculateProfileCompletion } from '../../services/automationService';
import { RecentActivityFeed } from './RecentActivityFeed';
import { AlumniDistributionChart } from './AlumniDistributionChart';
import { HelpAndInfoSection } from './HelpAndInfoSection';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    users,
    events,
    announcements,
    friendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    opportunities,
    chapters,
    setActiveTab,
    getOrCreateChat,
    sendFriendRequest,
    isConnected,
    hasPendingRequestWith,
    setSelectedUserIdForModal,
    unreadNotificationsCount,
    permissions
  } = useAlumni();

  const [announcementFilter, setAnnouncementFilter] = useState<'all' | 'personalized' | 'urgent'>('personalized');
  const [selectedAnnouncementForModal, setSelectedAnnouncementForModal] = useState<any | null>(null);

  // Personalized announcement feed using automation service algorithm
  const personalizedAnnouncements = useMemo(() => {
    return filterAnnouncementsForUser(announcements, currentUser);
  }, [announcements, currentUser]);

  const displayedAnnouncements = useMemo(() => {
    if (announcementFilter === 'personalized') {
      const matchOnly = personalizedAnnouncements.filter((a) => a.isPersonalized);
      return matchOnly.length > 0 ? matchOnly : personalizedAnnouncements;
    }
    if (announcementFilter === 'urgent') {
      return personalizedAnnouncements.filter((a) => a.urgent || a.important);
    }
    return personalizedAnnouncements;
  }, [personalizedAnnouncements, announcementFilter]);

  // Profile completion status
  const profileCompletion = useMemo(() => {
    if (!currentUser) return { percentage: 100, missingFields: [], isComplete: true };
    return calculateProfileCompletion(currentUser);
  }, [currentUser]);

  // Pending friend requests directed to current user
  const incomingRequests = friendRequests
    .filter((r) => r.toUid === currentUser?.uid && r.status === 'pending')
    .map((r) => {
      const sender = users.find((u) => u.uid === r.fromUid);
      return { request: r, sender };
    })
    .filter((item) => Boolean(item.sender));

  // Live stats calculation
  const totalMembers = users.length;
  const upcomingEventsCount = events.filter((e) => new Date(e.startDate) >= new Date()).length;
  // Unique courses count
  const activeCoursesCount = Array.from(new Set(users.map((u) => u.course).filter(Boolean))).length;
  const chaptersCount = chapters.length;

  // Alumni near you: filter other users whose location matches or is in the same city/region
  const alumniNearYou = React.useMemo(() => {
    if (!currentUser) return users.slice(0, 4);
    // Find users with matching location first, then others
    const userCity = currentUser?.location ? currentUser.location.split(',')[0].trim().toLowerCase() : '';
    const matches = userCity
      ? users.filter(
          (u) =>
            u.uid !== currentUser.uid &&
            u.role === 'alumni' &&
            (u.location || '').toLowerCase().includes(userCity)
        )
      : [];
    const others = users.filter(
      (u) =>
        u.uid !== currentUser.uid &&
        u.role === 'alumni' &&
        (!userCity || !(u.location || '').toLowerCase().includes(userCity))
    );
    return [...matches, ...others].slice(0, 4);
  }, [currentUser, users]);

  // Upcoming events
  const upcomingEvents = events
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  // Curated opportunities
  const curatedOpportunities = opportunities.slice(0, 3);

  return (
    <motion.div
      className="space-y-6 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Personalized Welcome Banner */}
      <motion.div
        variants={cardItemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-sm"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-blue-100 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Alumni Community Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.name || 'Alumnus'}!
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs sm:text-sm text-blue-100/90 font-medium">
            {currentUser?.batch && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Batch of {currentUser.batch}
              </span>
            )}
            {currentUser?.course && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {currentUser.course}
              </span>
            )}
            {currentUser?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-200" />
                {currentUser.location}
              </span>
            )}
          </div>

          <p className="mt-3 text-xs sm:text-sm text-blue-200/80 leading-relaxed max-w-2xl">
            Stay connected with fellow graduates, explore curated alumni job opportunities, and attend regional chapter reunions.
          </p>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 top-0 -bottom-10 w-96 bg-gradient-to-l from-white/10 to-transparent pointer-events-none rounded-r-2xl transform rotate-12" />
      </motion.div>

      {/* Live Stats Cards */}
      <motion.div variants={cardItemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Members</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{totalMembers}</span>
            <span className="text-xs text-emerald-600 font-medium">+12 this week</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Verified alumni and faculty</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Upcoming Events</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{upcomingEventsCount}</span>
            <span className="text-xs text-blue-600 font-medium">Reunions & Webinars</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">In-person and virtual</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Courses</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{activeCoursesCount}</span>
            <span className="text-xs text-stone-500 font-medium">Disciplines</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Engineering, Arts, Business</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Chapters Worldwide</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{chaptersCount}</span>
            <span className="text-xs text-purple-600 font-medium">Global Hubs</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">SF, NYC, Seattle, London</p>
        </div>
      </motion.div>

      {/* Alumni Demographics & Cohort Distribution Visualization - Strictly restricted to authorized roles (Admin, Registrar) and hidden from Employers */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'registrar' || currentUser?.role === 'superadmin' || currentUser?.role === 'staff') && (
        <motion.div variants={cardItemVariants}>
          <AlumniDistributionChart users={users} currentUser={currentUser} />
        </motion.div>
      )}

      {/* Quick Action Circles with Live Badges */}
      <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900 tracking-tight">Quick Actions</h2>
          <span className="text-xs text-stone-400">Direct navigation</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveTab('network')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-stone-50 transition-colors group relative text-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-700">Find Alumni</span>
            {incomingRequests.length > 0 && (
              <span className="absolute top-2 right-4 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-stone-50 transition-colors group relative text-center"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-emerald-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-700">Messages</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-stone-50 transition-colors group relative text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-700">Events</span>
          </button>

          <button
            onClick={() => setActiveTab('opportunities')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-stone-50 transition-colors group relative text-center"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-indigo-100">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-700">Job Board</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-stone-50 transition-colors group relative text-center"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-rose-100">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-700">Announce</span>
          </button>

          {permissions.canAccessAdminPanel ? (
            <button
              onClick={() => setActiveTab('admin')}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-stone-50 transition-colors group relative text-center"
            >
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-purple-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-stone-700">Admin Panel</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-stone-50 transition-colors group relative text-center"
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-stone-200">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-stone-700">My Profile</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Friend Request Banner with Accept/Decline */}
      {incomingRequests.length > 0 && (
        <motion.div variants={cardItemVariants} className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500 text-white">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Connection Requests ({incomingRequests.length})
                </h3>
                <p className="text-xs text-amber-700">Fellow alumni waiting to connect with you</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('network')}
              className="text-xs text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {incomingRequests.map(({ request, sender }) => (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-amber-200/60 shadow-2xs"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => sender && setSelectedUserIdForModal(sender.uid)}
                >
                  <img
                    src={sender?.profilePictureUrl}
                    alt={sender?.name}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 hover:text-blue-600">
                      {sender?.name}
                    </h4>
                    <p className="text-xs text-stone-500">
                      Batch {sender?.batch} • {sender?.course}
                    </p>
                    <p className="text-[11px] text-stone-400 line-clamp-1">{sender?.headline}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => acceptFriendRequest(request.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => declineFriendRequest(request.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Automated Profile Completion & Career Tracer Reminder (Triggered when < 80%) */}
      {currentUser && profileCompletion.percentage < 80 && (
        <motion.div variants={cardItemVariants} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950">
                    Profile Automation & Career Tracer Study
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    {profileCompletion.percentage}% Complete
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                  Help St. Cecilia’s College maintain institutional accreditation records by completing your current employment details. Missing: <span className="font-semibold">{profileCompletion.missingFields.slice(0, 3).join(', ')}</span>.
                </p>
                <div className="w-full sm:w-64 bg-amber-200/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs flex items-center gap-1.5 self-end sm:self-center"
            >
              <span>Complete Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Recent Activity Feed (Unified Events, Announcements & Connection Requests) */}
      <motion.div variants={cardItemVariants}>
        <RecentActivityFeed onOpenAnnouncement={(ann) => setSelectedAnnouncementForModal(ann)} />
      </motion.div>

      {/* Personalized Announcement Feed (Graduation Year & Department Targeted) */}
      <motion.div variants={cardItemVariants} className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 text-[#991B1B]">
                <Megaphone className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Announcements & Department Advisories
              </h2>
              {currentUser?.batch && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  Personalized for Batch {currentUser.batch}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              News and institutional circulars targeted to your academic department and graduation cohort
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-xl shrink-0 self-start sm:self-center">
            <button
              onClick={() => setAnnouncementFilter('personalized')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                announcementFilter === 'personalized'
                  ? 'bg-white text-[#991B1B] shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>For You</span>
            </button>

            <button
              onClick={() => setAnnouncementFilter('urgent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                announcementFilter === 'urgent'
                  ? 'bg-white text-red-600 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Urgent Alerts</span>
            </button>

            <button
              onClick={() => setAnnouncementFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                announcementFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>All ({announcements.length})</span>
            </button>
          </div>
        </div>

        {/* Announcement Cards Grid */}
        {displayedAnnouncements.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200/70">
            <Bell className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-stone-700">No announcements match this filter</h4>
            <p className="text-[11px] text-stone-500 mt-1">Check the "All" tab to browse all institutional notices.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedAnnouncements.slice(0, 6).map((ann: any) => {
              const isUrgent = ann.urgent || ann.important;
              const hasPersonalMatch = ann.isPersonalized && ann.matchReasons && ann.matchReasons.length > 0;

              return (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnnouncementForModal(ann)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isUrgent
                      ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                      : hasPersonalMatch
                      ? 'bg-blue-50/30 border-blue-200/80 hover:border-blue-300'
                      : 'bg-stone-50/50 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Header Tags */}
                    <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            {ann.urgent ? 'URGENT' : 'IMPORTANT'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-200/80 text-stone-700 uppercase">
                          {ann.category || 'General'}
                        </span>
                      </div>

                      {hasPersonalMatch && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                          <span>Personal Match</span>
                        </span>
                      )}
                    </div>

                    {/* Personal Match Reasons Pill */}
                    {hasPersonalMatch && ann.matchReasons && (
                      <div className="mb-2 flex items-center gap-1 flex-wrap">
                        {ann.matchReasons.map((reason: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100/80 text-emerald-800"
                          >
                            ✓ {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug hover:text-blue-600">
                      {ann.title}
                    </h3>

                    <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="truncate">
                      {ann.authorName || 'Alumni Affairs'}
                    </span>
                    <span className="text-[#991B1B] font-semibold flex items-center gap-0.5 shrink-0">
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
          <span>
            Showing {displayedAnnouncements.length} of {announcements.length} institutional advisories
          </span>
          <button
            onClick={() => setActiveTab('announcements')}
            className="text-xs font-semibold text-[#991B1B] hover:text-[#7f1616] flex items-center gap-1"
          >
            <span>Open Full Announcement Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Alumni Near You Section (Real Firestore Data) */}
      <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900 tracking-tight">Alumni Near You</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                {currentUser?.location || 'San Francisco, CA'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Graduates located in your metropolitan area and vicinity
            </p>
          </div>
          <button
            onClick={() => setActiveTab('network')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>Explore directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {alumniNearYou.map((alumnus) => {
            const connected = isConnected(alumnus.uid);
            const reqStatus = hasPendingRequestWith(alumnus.uid);

            return (
              <div
                key={alumnus.uid}
                className="bg-stone-50/70 hover:bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <img
                      src={alumnus.profilePictureUrl}
                      alt={alumnus.name}
                      onClick={() => setSelectedUserIdForModal(alumnus.uid)}
                      className="w-12 h-12 rounded-full object-cover border border-stone-300 cursor-pointer hover:opacity-90"
                    />
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-full">
                      Class of {alumnus.batch || '2024'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3
                      onClick={() => setSelectedUserIdForModal(alumnus.uid)}
                      className="font-bold text-sm text-stone-900 hover:text-blue-600 cursor-pointer"
                    >
                      {alumnus.name}
                    </h3>
                    <p className="text-xs text-blue-700 font-medium">Batch of {alumnus.batch}</p>
                    <p className="text-xs text-stone-600 line-clamp-2 mt-1">{alumnus.headline}</p>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-2">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{alumnus.location}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center gap-2">
                  {connected ? (
                    <button
                      onClick={() => {
                        getOrCreateChat(alumnus.uid);
                        setActiveTab('messages');
                      }}
                      className="w-full py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  ) : reqStatus === 'sent' ? (
                    <span className="w-full py-1.5 text-center text-xs font-medium text-stone-500 bg-stone-100 rounded-lg">
                      Request Sent
                    </span>
                  ) : reqStatus === 'received' ? (
                    <button
                      onClick={() => setActiveTab('network')}
                      className="w-full py-1.5 text-center text-xs font-semibold text-amber-700 bg-amber-100 rounded-lg"
                    >
                      Respond
                    </button>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(alumnus.uid)}
                      className="w-full py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Two Column Section: Upcoming Events Calendar & Curated Opportunities */}
      <motion.div variants={cardItemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Events Calendar */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">Upcoming Events</h2>
                <p className="text-xs text-stone-500">Reunions, workshops, and global webinars</p>
              </div>
              <button
                onClick={() => setActiveTab('events')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((evt) => {
                const eventDate = new Date(evt.startDate);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setActiveTab('events')}
                    className="p-3.5 rounded-xl border border-stone-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-start gap-3.5"
                  >
                    {/* Date Badge */}
                    <div className="w-12 h-13 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0 text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-600">
                        {eventDate.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-base font-extrabold text-blue-900 leading-none">
                        {eventDate.getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {evt.isImportant && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded">
                            Important
                          </span>
                        )}
                        {evt.isVirtual ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
                            Virtual Webinar
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-stone-100 text-stone-600 rounded">
                            In-Person
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-stone-900 mt-1 truncate">{evt.title}</h3>

                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </span>
                        <span>•</span>
                        <span>{evt.attendeesCount} attending</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <button
              onClick={() => setActiveTab('events')}
              className="w-full py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg text-center transition-colors"
            >
              Browse Event Calendar & RSVP
            </button>
          </div>
        </div>

        {/* Curated Opportunities Feed */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  Curated Opportunities
                </h2>
                <p className="text-xs text-stone-500">Jobs, internships & alumni mentorship</p>
              </div>
              <button
                onClick={() => setActiveTab('opportunities')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <span>View job board</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {curatedOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => setActiveTab('opportunities')}
                  className="p-3.5 rounded-xl border border-stone-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-stone-900 truncate">{opp.title}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-md shrink-0">
                        {opp.type}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 font-medium mt-0.5">
                      {opp.company} • <span className="text-stone-500">{opp.location}</span>
                    </div>

                    {opp.salaryOrStipend && (
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                        {opp.salaryOrStipend}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <button
              onClick={() => setActiveTab('opportunities')}
              className="w-full py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg text-center transition-colors"
            >
              Post or Search Career Opportunities
            </button>
          </div>
        </div>
      </motion.div>

      {/* Help and Information Section at the bottom of the User Dashboard */}
      <motion.div variants={cardItemVariants}>
        <HelpAndInfoSection />
      </motion.div>

      {/* Selected Announcement Detail Modal */}
      {selectedAnnouncementForModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex items-start justify-between gap-3 bg-stone-50/50">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedAnnouncementForModal.urgent && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    URGENT ADVISORY
                  </span>
                )}
                {selectedAnnouncementForModal.important && !selectedAnnouncementForModal.urgent && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-600 text-white">
                    IMPORTANT
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-200 text-stone-800 uppercase">
                  {selectedAnnouncementForModal.category || 'Institutional'}
                </span>
                {selectedAnnouncementForModal.isPersonalized && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    Targeted To You
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedAnnouncementForModal(null)}
                className="p-1 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-lg font-bold text-stone-900 leading-snug">
                {selectedAnnouncementForModal.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-stone-500 pb-3 border-b border-stone-100">
                <span className="font-semibold text-stone-700">
                  {selectedAnnouncementForModal.authorName || 'Alumni Affairs Office'}
                </span>
                <span>•</span>
                <span>
                  {new Date(selectedAnnouncementForModal.publishedAt).toLocaleDateString([], {
                    dateStyle: 'medium'
                  })}
                </span>
              </div>

              {selectedAnnouncementForModal.matchReasons && selectedAnnouncementForModal.matchReasons.length > 0 && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-900">
                  <span className="font-bold block mb-1">Why this was delivered to your feed:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAnnouncementForModal.matchReasons.map((r: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-white rounded-md font-medium text-blue-800 shadow-2xs">
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {selectedAnnouncementForModal.content}
              </p>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedAnnouncementForModal(null);
                  setActiveTab('announcements');
                }}
                className="text-xs text-[#991B1B] font-semibold hover:underline"
              >
                View in Announcement Board →
              </button>
              <button
                onClick={() => setSelectedAnnouncementForModal(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

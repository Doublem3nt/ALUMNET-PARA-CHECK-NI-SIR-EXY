import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Megaphone,
  UserCheck,
  UserPlus,
  Clock,
  ChevronRight,
  Check,
  X,
  Sparkles,
  AlertCircle,
  MapPin,
  Building2,
  Users,
  Eye,
  ArrowRight,
  Briefcase,
  GraduationCap,
  DollarSign,
  Radio
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { AlumniEvent, Announcement, FriendRequest, Opportunity, UserProfile } from '../../types';

interface RecentActivityFeedProps {
  onOpenAnnouncement?: (announcement: Announcement) => void;
  onOpenEventModal?: (event: AlumniEvent) => void;
  onOpenOpportunity?: (opportunity: Opportunity) => void;
}

type ActivityType = 'event' | 'opportunity' | 'alumni_registration' | 'announcement' | 'connection_request';

interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO date
  dateObj: Date;
  title: string;
  subtitle?: string;
  contentSnippet?: string;
  badgeText?: string;
  badgeVariant?: 'blue' | 'amber' | 'emerald' | 'red' | 'purple' | 'indigo';
  isUrgent?: boolean;
  avatarUrl?: string;
  eventData?: AlumniEvent;
  opportunityData?: Opportunity;
  announcementData?: Announcement;
  friendRequestData?: {
    request: FriendRequest;
    sender?: UserProfile;
  };
  userData?: UserProfile;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  onOpenAnnouncement,
  onOpenEventModal,
  onOpenOpportunity
}) => {
  const {
    currentUser,
    events,
    opportunities,
    announcements,
    friendRequests,
    users,
    acceptFriendRequest,
    declineFriendRequest,
    rsvpEvent,
    sendFriendRequest,
    hasPendingRequestWith,
    isConnected,
    setActiveTab,
    setSelectedUserIdForModal
  } = useAlumni();

  const [filter, setFilter] = useState<'all' | 'event' | 'opportunity' | 'alumni' | 'announcement'>('all');

  // Format relative time helper
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Build unified chronological activity items
  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // 1. Events Activities
    events.forEach((evt) => {
      const evtStartDate = new Date(evt.startDate);
      const isFuture = evtStartDate.getTime() >= Date.now();

      items.push({
        id: `act_evt_${evt.id}`,
        type: 'event',
        timestamp: evt.startDate,
        dateObj: evtStartDate,
        title: evt.title,
        subtitle: `${evt.isVirtual ? 'Virtual Webinar' : evt.location} • ${evt.attendeesCount} alumni attending`,
        contentSnippet: evt.description,
        badgeText: isFuture ? 'Upcoming Campus Event' : 'Recent Event',
        badgeVariant: evt.isImportant ? 'red' : 'blue',
        isUrgent: evt.isImportant,
        eventData: evt
      });
    });

    // 2. Job Opportunities Activities
    const approvedOpportunities = opportunities.filter(
      (opp) => !opp.approvalStatus || opp.approvalStatus === 'approved'
    );
    approvedOpportunities.forEach((opp) => {
      const oppDate = new Date(opp.createdAt || Date.now());

      items.push({
        id: `act_opp_${opp.id}`,
        type: 'opportunity',
        timestamp: opp.createdAt || new Date().toISOString(),
        dateObj: oppDate,
        title: `${opp.title} at ${opp.company}`,
        subtitle: `${opp.type} • ${opp.location} • ${opp.salaryOrStipend || 'Competitive Rate'}`,
        contentSnippet: opp.description,
        badgeText: `Hiring: ${opp.type}`,
        badgeVariant: 'indigo',
        opportunityData: opp
      });
    });

    // 3. New Alumni Registrations
    const registeredAlumni = users
      .filter((u) => u.role === 'alumni' && u.uid !== currentUser?.uid)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    registeredAlumni.forEach((alum) => {
      const joinDate = new Date(alum.createdAt || Date.now());
      items.push({
        id: `act_reg_${alum.uid}`,
        type: 'alumni_registration',
        timestamp: alum.createdAt || new Date().toISOString(),
        dateObj: joinDate,
        title: `${alum.name} joined the St. Cecilia Alumni Directory`,
        subtitle: `Class of ${alum.batch || 'Alumni'} • ${alum.course || 'Degree Graduate'}`,
        contentSnippet: alum.headline || alum.about || 'Newly registered Cecilian alumnus.',
        badgeText: alum.batch && currentUser?.batch && alum.batch === currentUser.batch
          ? `Batch ${currentUser.batch} Alum`
          : 'New Registration',
        badgeVariant: 'purple',
        avatarUrl: alum.profilePictureUrl,
        userData: alum
      });
    });

    // 4. Announcements Activities
    announcements.forEach((ann) => {
      const pubDate = new Date(ann.publishedAt || Date.now());

      items.push({
        id: `act_ann_${ann.id}`,
        type: 'announcement',
        timestamp: ann.publishedAt || new Date().toISOString(),
        dateObj: pubDate,
        title: ann.title,
        subtitle: `${ann.authorName || 'Alumni Affairs'} • ${ann.category || 'Institutional Advisory'}`,
        contentSnippet: ann.content,
        badgeText: ann.urgent ? 'URGENT NOTICE' : ann.important ? 'Important' : 'Announcement',
        badgeVariant: ann.urgent ? 'red' : ann.important ? 'amber' : 'emerald',
        isUrgent: ann.urgent || ann.important,
        announcementData: ann
      });
    });

    // 5. Incoming Connection Requests for current user
    if (currentUser) {
      friendRequests
        .filter((r) => r.toUid === currentUser.uid && r.status === 'pending')
        .forEach((req) => {
          const sender = users.find((u) => u.uid === req.fromUid);
          const reqDate = new Date(req.createdAt || Date.now());

          items.push({
            id: `act_req_${req.id}`,
            type: 'connection_request',
            timestamp: req.createdAt || new Date().toISOString(),
            dateObj: reqDate,
            title: `${sender?.name || 'Fellow Alumnus'} sent you a connection request`,
            subtitle: `Class of ${sender?.batch || 'Alumni'} • ${sender?.course || 'Degree Graduate'}`,
            contentSnippet: sender?.headline || 'Interested in connecting with fellow Cecilian graduates.',
            badgeText: 'Pending Connection',
            badgeVariant: 'amber',
            avatarUrl: sender?.profilePictureUrl,
            friendRequestData: {
              request: req,
              sender
            }
          });
        });
    }

    // Sort descending by recency
    return items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [events, opportunities, announcements, friendRequests, users, currentUser]);

  // Filter items
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activityItems;
    if (filter === 'event') return activityItems.filter((i) => i.type === 'event');
    if (filter === 'opportunity') return activityItems.filter((i) => i.type === 'opportunity');
    if (filter === 'alumni') {
      return activityItems.filter(
        (i) => i.type === 'alumni_registration' || i.type === 'connection_request'
      );
    }
    if (filter === 'announcement') return activityItems.filter((i) => i.type === 'announcement');
    return activityItems;
  }, [activityItems, filter]);

  const eventCount = useMemo(() => activityItems.filter((i) => i.type === 'event').length, [activityItems]);
  const jobCount = useMemo(() => activityItems.filter((i) => i.type === 'opportunity').length, [activityItems]);
  const alumniCount = useMemo(() => activityItems.filter((i) => i.type === 'alumni_registration').length, [activityItems]);
  const announcementCount = useMemo(() => activityItems.filter((i) => i.type === 'announcement').length, [activityItems]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
      {/* Feed Header with Real-Time Indicator */}
      <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-stone-50/70 to-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#991B1B]/10 text-[#991B1B]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              Recent Activity Feed
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Real-Time Sync</span>
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Aggregated stream of campus event postings, new job opportunities, and recent alumni registrations
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 bg-stone-100/90 p-1 rounded-xl shrink-0 self-start lg:self-center overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Activity ({activityItems.length})
          </button>

          <button
            onClick={() => setFilter('event')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'event'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events ({eventCount})</span>
          </button>

          <button
            onClick={() => setFilter('opportunity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'opportunity'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Jobs & Careers ({jobCount})</span>
          </button>

          <button
            onClick={() => setFilter('alumni')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'alumni'
                ? 'bg-white text-purple-700 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>New Alumni ({alumniCount})</span>
          </button>

          <button
            onClick={() => setFilter('announcement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'announcement'
                ? 'bg-white text-[#991B1B] shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Notices ({announcementCount})</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="divide-y divide-stone-100">
        {filteredActivities.length === 0 ? (
          <div className="p-10 text-center text-stone-500">
            <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-stone-700">No recent activities in this category</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Check back soon for new community happenings or switch to All Activity.
            </p>
          </div>
        ) : (
          filteredActivities.slice(0, 10).map((item) => {
            const timeAgo = getRelativeTime(item.dateObj);

            // 1. EVENT POSTING
            if (item.type === 'event' && item.eventData) {
              const evt = item.eventData;
              const evtDate = new Date(evt.startDate);
              const isGoing = evt.userRsvp === 'going';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-blue-50/20 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-blue-700 shrink-0 shadow-2xs">
                      <span className="text-[9px] font-extrabold uppercase leading-none text-blue-600">
                        {evtDate.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-sm font-extrabold leading-tight text-blue-950">
                        {evtDate.getDate()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                          {evt.type ? evt.type.toUpperCase() : 'CAMPUS EVENT'}
                        </span>
                        {evt.isImportant && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Priority
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => {
                          if (onOpenEventModal) onOpenEventModal(evt);
                          else setActiveTab('events');
                        }}
                        className="text-sm font-bold text-stone-900 mt-1 hover:text-blue-600 cursor-pointer truncate"
                      >
                        {evt.title}
                      </h3>

                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                        {evt.isVirtual ? 'Virtual Webinar' : evt.location} • <span className="font-semibold text-blue-700">{evt.attendeesCount} alumni confirmed</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => rsvpEvent(evt.id, isGoing ? 'not_going' : 'going')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isGoing
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isGoing ? 'Attending' : 'RSVP'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenEventModal) onOpenEventModal(evt);
                        else setActiveTab('events');
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // 2. JOB OPPORTUNITY POSTING
            if (item.type === 'opportunity' && item.opportunityData) {
              const opp = item.opportunityData;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-indigo-50/20 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 shadow-2xs">
                      <Briefcase className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {opp.type || 'CAREER'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-stone-500" />
                          {opp.company}
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => {
                          if (onOpenOpportunity) onOpenOpportunity(opp);
                          else setActiveTab('opportunities');
                        }}
                        className="text-sm font-bold text-stone-900 mt-1 hover:text-indigo-600 cursor-pointer truncate"
                      >
                        {opp.title}
                      </h3>

                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                        {opp.location} • {opp.salaryOrStipend || 'Competitive Salary'} • {opp.requiredCourse || 'Open to all graduates'}
                      </p>

                      {opp.skills && opp.skills.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {opp.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-medium rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                          {opp.skills.length > 3 && (
                            <span className="text-[10px] text-stone-400 font-medium">
                              +{opp.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        if (onOpenOpportunity) onOpenOpportunity(opp);
                        else setActiveTab('opportunities');
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span>View & Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // 3. NEW ALUMNI REGISTRATION
            if (item.type === 'alumni_registration' && item.userData) {
              const alum = item.userData;
              const reqStatus = hasPendingRequestWith(alum.uid);
              const connected = isConnected(alum.uid);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-purple-50/20 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={
                        alum.profilePictureUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={alum.name}
                      onClick={() => setSelectedUserIdForModal(alum.uid)}
                      className="w-11 h-11 rounded-full object-cover border border-purple-200 shrink-0 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {item.badgeText}
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedUserIdForModal(alum.uid)}
                        className="text-sm font-bold text-stone-900 mt-1 hover:text-purple-700 cursor-pointer truncate"
                      >
                        {alum.name}
                      </h3>

                      <p className="text-xs text-stone-500 mt-0.5 truncate">
                        Batch {alum.batch || 'Alumni'} • {alum.course || 'Graduate'} {alum.location ? `• ${alum.location}` : ''}
                      </p>

                      {alum.headline && (
                        <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-md">
                          {alum.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUserIdForModal(alum.uid)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      Profile
                    </button>

                    {connected ? (
                      <span className="px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Connected
                      </span>
                    ) : reqStatus === 'sent' ? (
                      <span className="px-3 py-1.5 text-xs text-stone-500 bg-stone-100 rounded-lg">
                        Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(alum.uid)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // 4. ANNOUNCEMENT
            if (item.type === 'announcement' && item.announcementData) {
              const ann = item.announcementData;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    ann.urgent ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        ann.urgent
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-rose-50 text-[#991B1B] border border-rose-100'
                      }`}
                    >
                      <Megaphone className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ann.urgent ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            URGENT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700 uppercase">
                            {ann.category || 'Advisory'}
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => onOpenAnnouncement && onOpenAnnouncement(ann)}
                        className="text-sm font-bold text-stone-900 mt-1 hover:text-[#991B1B] cursor-pointer truncate"
                      >
                        {ann.title}
                      </h3>

                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1 max-w-xl">
                        {ann.content}
                      </p>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onOpenAnnouncement && onOpenAnnouncement(ann)}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <span>Read Advisory</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // 5. CONNECTION REQUEST
            if (item.type === 'connection_request' && item.friendRequestData) {
              const { request, sender } = item.friendRequestData;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 bg-amber-50/40 hover:bg-amber-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={
                        sender?.profilePictureUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={sender?.name || 'Alumnus'}
                      onClick={() => sender && setSelectedUserIdForModal(sender.uid)}
                      className="w-11 h-11 rounded-full object-cover border border-amber-300 shrink-0 cursor-pointer shadow-2xs"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-900">
                          Connection Request
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => sender && setSelectedUserIdForModal(sender.uid)}
                        className="text-sm font-bold text-stone-900 mt-1 hover:text-blue-600 cursor-pointer"
                      >
                        {sender?.name} wants to connect with you
                      </h3>

                      <p className="text-xs text-stone-600 mt-0.5 truncate">
                        Batch {sender?.batch} • {sender?.course}
                      </p>
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
              );
            }

            return null;
          })
        )}
      </div>

      {/* Feed Footer */}
      <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Aggregated real-time feed: events, jobs, and alumni network</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('events')}
            className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Events</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span>•</span>
          <button
            onClick={() => setActiveTab('opportunities')}
            className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Career Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span>•</span>
          <button
            onClick={() => setActiveTab('network')}
            className="font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>Alumni Directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};


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
  ArrowRight
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { AlumniEvent, Announcement, FriendRequest, UserProfile } from '../../types';

interface RecentActivityFeedProps {
  onOpenAnnouncement?: (announcement: Announcement) => void;
  onOpenEventModal?: (event: AlumniEvent) => void;
}

type ActivityType = 'event' | 'announcement' | 'connection_request' | 'network_join';

interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO date
  dateObj: Date;
  title: string;
  subtitle?: string;
  contentSnippet?: string;
  badgeText?: string;
  badgeVariant?: 'blue' | 'amber' | 'emerald' | 'red' | 'purple';
  isUrgent?: boolean;
  avatarUrl?: string;
  eventData?: AlumniEvent;
  announcementData?: Announcement;
  friendRequestData?: {
    request: FriendRequest;
    sender?: UserProfile;
  };
  userData?: UserProfile;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  onOpenAnnouncement,
  onOpenEventModal
}) => {
  const {
    currentUser,
    events,
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

  const [filter, setFilter] = useState<'all' | 'event' | 'announcement' | 'connection'>('all');

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
        badgeText: isFuture ? 'Upcoming Event' : 'Recent Gathering',
        badgeVariant: evt.isImportant ? 'red' : 'blue',
        isUrgent: evt.isImportant,
        eventData: evt
      });
    });

    // 2. Announcements Activities
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

    // 3. Incoming Connection Requests for current user
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

      // 4. Recently registered alumni from same batch or course (relevance recommendation)
      const sameBatchOrCourseUsers = users
        .filter(
          (u) =>
            u.uid !== currentUser.uid &&
            u.role === 'alumni' &&
            (u.batch === currentUser.batch || u.course === currentUser.course) &&
            !isConnected(u.uid)
        )
        .slice(0, 2);

      sameBatchOrCourseUsers.forEach((recUser) => {
        const joinDate = new Date(recUser.createdAt || Date.now());
        items.push({
          id: `act_join_${recUser.uid}`,
          type: 'network_join',
          timestamp: recUser.createdAt || new Date().toISOString(),
          dateObj: joinDate,
          title: `${recUser.name} joined the St. Cecilia Alumni Network`,
          subtitle: `Batch ${recUser.batch} • ${recUser.course}`,
          contentSnippet: recUser.headline || 'New member registered in the official directory.',
          badgeText: recUser.batch === currentUser.batch ? `Batch ${currentUser.batch} Alum` : 'Same Department',
          badgeVariant: 'purple',
          avatarUrl: recUser.profilePictureUrl,
          userData: recUser
        });
      });
    }

    // Sort descending by recency
    return items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [events, announcements, friendRequests, users, currentUser, isConnected]);

  // Filter items
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activityItems;
    if (filter === 'event') return activityItems.filter((i) => i.type === 'event');
    if (filter === 'announcement') return activityItems.filter((i) => i.type === 'announcement');
    if (filter === 'connection') {
      return activityItems.filter(
        (i) => i.type === 'connection_request' || i.type === 'network_join'
      );
    }
    return activityItems;
  }, [activityItems, filter]);

  const pendingRequestsCount = friendRequests.filter(
    (r) => r.toUid === currentUser?.uid && r.status === 'pending'
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
      {/* Feed Header */}
      <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-50/70 to-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#991B1B]/10 text-[#991B1B]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              Recent Activity Feed
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Updates
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Stay up to date with new alumni events, institutional bulletins, and connection requests
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 bg-stone-100/90 p-1 rounded-xl shrink-0 self-start sm:self-center overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Updates ({activityItems.length})
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
            <span>Events ({events.length})</span>
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
            <span>Notices ({announcements.length})</span>
          </button>

          <button
            onClick={() => setFilter('connection')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'connection'
                ? 'bg-white text-amber-700 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Connections</span>
            {pendingRequestsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
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
              Check back soon for new community happenings or view all updates.
            </p>
          </div>
        ) : (
          filteredActivities.slice(0, 8).map((item) => {
            const timeAgo = getRelativeTime(item.dateObj);

            // Render based on activity type
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
                    {/* Event Calendar Icon Box */}
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
                          {evt.type ? evt.type.toUpperCase() : 'EVENT'}
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
                        onClick={() => setActiveTab('events')}
                        className="text-sm font-bold text-stone-900 mt-1 hover:text-blue-600 cursor-pointer truncate"
                      >
                        {evt.title}
                      </h3>

                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                        {evt.isVirtual ? 'Webinar Online' : evt.location} • {evt.attendeesCount} attending
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
                      onClick={() => setActiveTab('events')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

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

            if (item.type === 'network_join' && item.userData) {
              const alum = item.userData;
              const reqStatus = hasPendingRequestWith(alum.uid);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-stone-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={
                        alum.profilePictureUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={alum.name}
                      onClick={() => setSelectedUserIdForModal(alum.uid)}
                      className="w-11 h-11 rounded-full object-cover border border-stone-200 shrink-0 cursor-pointer shadow-2xs"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                          {item.badgeText}
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedUserIdForModal(alum.uid)}
                        className="text-sm font-bold text-stone-900 mt-1 hover:text-blue-600 cursor-pointer"
                      >
                        {alum.name}
                      </h3>

                      <p className="text-xs text-stone-500 mt-0.5 truncate">
                        Batch {alum.batch} • {alum.course}
                      </p>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    {reqStatus === 'sent' ? (
                      <span className="px-3 py-1.5 text-xs text-stone-500 bg-stone-100 rounded-lg">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(alum.uid)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {/* Feed Footer */}
      <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <span>Showing latest community updates and announcements</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('events')}
            className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Events Calendar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span>•</span>
          <button
            onClick={() => setActiveTab('announcements')}
            className="font-semibold text-[#991B1B] hover:text-[#7f1616] flex items-center gap-1"
          >
            <span>All Circulars</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

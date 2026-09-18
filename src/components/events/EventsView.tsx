import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  MessageCircle,
  Plus,
  Filter,
  Check,
  Video,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Share2,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  CornerDownRight,
  Search,
  UserCheck,
  UserPlus,
  Mail,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { AlumniEvent } from '../../types';
import { ShareModal, ShareItem } from '../common/ShareModal';

export const EventsView: React.FC = () => {
  const {
    currentUser,
    events,
    createEvent,
    editEvent,
    deleteEvent,
    toggleLikeEvent,
    addCommentToEvent,
    rsvpEvent,
    permissions,
    setSelectedUserIdForModal,
    getOrCreateChat,
    setActiveTab,
    setActiveChatId,
    sendFriendRequest,
    isConnected
  } = useAlumni();

  const [filterType, setFilterType] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<AlumniEvent | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'attendees'>('details');
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
  const [attendeeStatusFilter, setAttendeeStatusFilter] = useState<'all' | 'going' | 'interested'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  
  // Side-panel comment drawer state (replaces messy inline card accordion)
  const [sidePanelEventId, setSidePanelEventId] = useState<string | null>(null);
  const [sidePanelCommentInput, setSidePanelCommentInput] = useState('');
  const [isDraggingHeroImage, setIsDraggingHeroImage] = useState(false);

  // Form State for Create / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState<'reunion' | 'workshop' | 'networking' | 'webinar' | 'social'>('networking');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formHeroImage, setFormHeroImage] = useState('');
  const [formIsVirtual, setFormIsVirtual] = useState(false);
  const [formIsImportant, setFormIsImportant] = useState(false);
  const [formMaxAttendees, setFormMaxAttendees] = useState(250);
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);

  const now = new Date();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const eventDate = new Date(e.startDate);
      if (filterType === 'upcoming') {
        return eventDate >= now;
      }
      if (filterType === 'past') {
        return eventDate < now;
      }
      return true;
    }).sort((a, b) => {
      if (filterType === 'past') {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events, filterType, now]);

  // Dynamically resolve active modal event from events list for live sync
  const activeEvent = useMemo(() => {
    if (!selectedEventForDetail) return null;
    return events.find((e) => e.id === selectedEventForDetail.id) || selectedEventForDetail;
  }, [events, selectedEventForDetail]);

  // Filtered attendees for the active event
  const filteredAttendees = useMemo(() => {
    if (!activeEvent) return [];
    let list = activeEvent.attendees || [];
    if (attendeeStatusFilter !== 'all') {
      list = list.filter((a) => a.status === attendeeStatusFilter);
    }
    if (attendeeSearchQuery.trim()) {
      const q = attendeeSearchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.batch && a.batch.toLowerCase().includes(q)) ||
          (a.course && a.course.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeEvent, attendeeStatusFilter, attendeeSearchQuery]);

  const openCreateModal = () => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDescription('');
    setFormLocation('Campus Main Pavilion, San Francisco, CA');
    setFormType('networking');
    // default to 2 weeks ahead
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14);
    setFormStartDate(nextDate.toISOString().slice(0, 16));
    setFormEndDate(nextDate.toISOString().slice(0, 16));
    setFormHeroImage('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80');
    setFormIsVirtual(false);
    setFormIsImportant(false);
    setFormMaxAttendees(200);
    setShowCreateModal(true);
  };

  const openEditModal = (e: AlumniEvent) => {
    setEditingEventId(e.id);
    setFormTitle(e.title);
    setFormDescription(e.description);
    setFormLocation(e.location);
    setFormType(e.type);
    setFormStartDate(e.startDate.slice(0, 16));
    setFormEndDate(e.endDate.slice(0, 16));
    setFormHeroImage(e.heroImageUrl);
    setFormIsVirtual(e.isVirtual);
    setFormIsImportant(e.isImportant);
    setFormMaxAttendees(e.maxAttendees);
    setShowCreateModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formLocation) return;

    if (editingEventId) {
      editEvent(editingEventId, {
        title: formTitle,
        description: formDescription,
        location: formLocation,
        type: formType,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        heroImageUrl: formHeroImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
        isVirtual: formIsVirtual,
        isImportant: formIsImportant,
        maxAttendees: Number(formMaxAttendees)
      });
    } else {
      createEvent({
        title: formTitle,
        description: formDescription,
        location: formLocation,
        type: formType,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        heroImageUrl: formHeroImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
        isVirtual: formIsVirtual,
        isImportant: formIsImportant,
        maxAttendees: Number(formMaxAttendees)
      });
    }

    setShowCreateModal(false);
  };

  const sidePanelEvent = useMemo(() => {
    if (!sidePanelEventId) return null;
    return events.find((e) => e.id === sidePanelEventId) || null;
  }, [events, sidePanelEventId]);

  const handleSidePanelCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidePanelEventId || !sidePanelCommentInput.trim()) return;
    addCommentToEvent(sidePanelEventId, sidePanelCommentInput.trim());
    setSidePanelCommentInput('');
  };

  const handleHeroFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormHeroImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHeroFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHeroImage(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormHeroImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePostComment = (eventId: string) => {
    if (!commentInput.trim()) return;
    addCommentToEvent(eventId, commentInput);
    setCommentInput('');
    // refresh selected event
    if (selectedEventForDetail?.id === eventId) {
      const updated = events.find((e) => e.id === eventId);
      if (updated) setSelectedEventForDetail(updated);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Filters & Create Event Button */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Alumni Events & Reunions
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {events.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Connect with fellow graduates at in-person gatherings, campus homecomings, and international webinars.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'upcoming'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilterType('past')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'past'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All
              </button>
            </div>

            {/* Create Event (Restricted: admin, registrar, staff, moderator) */}
            {permissions.canCreateEvents && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events Active Filter Notice */}
      {filterType === 'upcoming' && (
        <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">Prioritizing Upcoming Gatherings ({filteredEvents.length})</span>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Past events are automatically filtered out to ensure your schedule stays clear and actionable.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className="text-[11px] font-bold text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
          >
            View Past Archives ({events.filter((e) => new Date(e.startDate) < now).length})
          </button>
        </div>
      )}

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-stone-200">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-stone-700">No events found</p>
          <p className="text-xs text-stone-400 mt-1">There are no {filterType} events scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt, idx) => {
            const eventDate = new Date(evt.startDate);
            const isLiked = currentUser ? (evt.likes || []).includes(currentUser.uid) : false;

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Hero Image */}
                  <div className="relative h-44 overflow-hidden bg-stone-100">
                    <img
                      src={evt.heroImageUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Flags */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {evt.isImportant && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-md shadow-xs">
                          Important
                        </span>
                      )}
                      {evt.isVirtual ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md flex items-center gap-1 shadow-xs">
                          <Video className="w-3 h-3" />
                          Virtual
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white rounded-md">
                          In-Person
                        </span>
                      )}
                    </div>

                    {/* Date Badge */}
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs rounded-xl px-2.5 py-1 text-center shadow-xs border border-stone-200">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">
                        {eventDate.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-sm font-extrabold text-stone-900 block leading-tight">
                        {eventDate.getDate()}
                      </span>
                    </div>

                    {/* Admin Delete/Edit button */}
                    {permissions.canDeleteEventsComments && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs rounded-lg p-1 border border-stone-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(evt);
                          }}
                          className="p-1 hover:text-blue-600 text-stone-600 rounded"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this event?')) deleteEvent(evt.id);
                          }}
                          className="p-1 hover:text-red-600 text-stone-600 rounded"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">
                      {evt.type}
                    </div>

                    <h3
                      onClick={() => setSelectedEventForDetail(evt)}
                      className="text-base font-bold text-stone-900 hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
                    >
                      {evt.title}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          {eventDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}{' '}
                          • {eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                {/* Footer Controls: RSVP, Likes & Comments */}
                <div className="p-4 pt-3 bg-stone-50/60 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-2.5 text-xs text-stone-500">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventForDetail(evt);
                        setModalTab('attendees');
                      }}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors group text-left"
                      title="Click to view full attendee roster"
                    >
                      <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                        {(evt.attendees && evt.attendees.length > 0 ? evt.attendees.slice(0, 3) : []).map((att, i) => (
                          <img
                            key={att.uid || i}
                            src={att.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                            alt={att.name}
                            className="inline-block h-5 w-5 rounded-full ring-1 ring-white object-cover shadow-2xs"
                          />
                        ))}
                      </div>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-stone-400 group-hover:text-blue-500" />
                        <span className="font-bold text-stone-800 group-hover:text-blue-600">
                          {evt.attendeesCount}
                        </span>
                        <span className="underline decoration-dotted text-[11px] text-stone-500 group-hover:text-blue-600">
                          attendees
                        </span>
                      </span>
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareItem({
                            title: evt.title,
                            text: `${evt.title} — scheduled for ${new Date(evt.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${evt.location}. Join the St. Cecilia's Alumni Network!`,
                            type: evt.type === 'reunion' ? 'reunion' : 'event'
                          });
                        }}
                        className="flex items-center gap-1 text-xs text-stone-500 hover:text-blue-600 font-medium transition-colors"
                        title="Share Event across apps"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Share</span>
                      </button>

                      <button
                        onClick={() => toggleLikeEvent(evt.id)}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          isLiked ? 'text-red-600 font-bold' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-600' : ''}`} />
                        <span>{(evt.likes || []).length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSidePanelEventId(evt.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-[#8B181B] bg-stone-100 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-stone-200/70"
                        title="Open comments side-panel"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#8B181B]" />
                        <span>Comments ({(evt.comments || []).length})</span>
                      </button>
                    </div>
                  </div>

                  {/* RSVP & Attendance Tracker Component */}
                  <div className="pt-3 border-t border-stone-200/80 flex flex-col gap-2.5">
                    {/* RSVP Count Tracker */}
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-stone-800">
                          <Users className="w-3.5 h-3.5 text-[#8B181B]" />
                          <span>RSVP Tracker:</span>
                          <span className="text-[#8B181B] font-extrabold">{evt.attendeesCount} Registered</span>
                          <span className="text-stone-400 font-normal">/ {evt.maxAttendees || 300} spots</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.userRsvp === 'going'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : evt.userRsvp === 'interested'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-stone-200/70 text-stone-700'
                        }`}>
                          {evt.userRsvp === 'going'
                            ? '✓ Confirmed Going'
                            : evt.userRsvp === 'interested'
                            ? 'Interested'
                            : 'Open for RSVP'}
                        </span>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            evt.userRsvp === 'going' ? 'bg-emerald-500' : 'bg-[#8B181B]'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(8, Math.round((evt.attendeesCount / (evt.maxAttendees || 300)) * 100)))}%`
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                            {(evt.attendees && evt.attendees.length > 0 ? evt.attendees.slice(0, 4) : []).map((att, i) => (
                              <img
                                key={att.uid || i}
                                src={att.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                                alt={att.name}
                                className="inline-block h-4.5 w-4.5 rounded-full ring-1 ring-white object-cover shadow-2xs"
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-stone-600 pl-1 font-medium">
                            {evt.attendeesCount > 0 ? `${evt.attendeesCount} Cecilian alumni confirmed` : 'Be the first to RSVP!'}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          ✓ Reminders: 1-Day Prior & Event Day
                        </span>
                      </div>
                    </div>

                    {/* Prominent RSVP Action Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => rsvpEvent(evt.id, 'going')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                          evt.userRsvp === 'going'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30'
                            : 'bg-[#8B181B] hover:bg-[#721316] text-white hover:shadow-md active:scale-95'
                        }`}
                      >
                        <Check className={`w-4 h-4 ${evt.userRsvp === 'going' ? 'text-white' : 'text-amber-300'}`} />
                        <span>
                          {evt.userRsvp === 'going' ? 'RSVP Confirmed (Attending) • Cancel' : 'RSVP Attendance'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => rsvpEvent(evt.id, 'interested')}
                        title="Mark as Interested"
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          evt.userRsvp === 'interested'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Interested</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedEventForDetail(evt)}
                        className="py-2.5 px-3 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                        title="View Full Event Details"
                      >
                        Details
                      </button>
                    </div>

                    {/* Quick Access to Event Group Chat */}
                    {evt.groupChatId && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatId(evt.groupChatId!);
                          setActiveTab('messages');
                        }}
                        className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-[#991B1B] border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Open official event group chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Open Event Group Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Hero Banner inside modal */}
            <div className="relative h-52 bg-stone-900 shrink-0">
              <img
                src={activeEvent.heroImageUrl}
                alt={activeEvent.title}
                className="w-full h-full object-cover opacity-80"
              />
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="absolute top-4 right-4 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setShareItem({
                    title: activeEvent.title,
                    text: `${activeEvent.title} — scheduled for ${new Date(activeEvent.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${activeEvent.location}. St. Cecilia's College Alumni Network.`,
                    type: activeEvent.type === 'reunion' ? 'reunion' : 'event'
                  })
                }
                className="absolute top-4 right-14 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                title="Share Event Across Apps"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  {activeEvent.isImportant && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 rounded">
                      Important
                    </span>
                  )}
                  {activeEvent.isVirtual && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 rounded">
                      Virtual Event
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/20 backdrop-blur-xs rounded uppercase">
                    {activeEvent.type}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold leading-tight">
                  {activeEvent.title}
                </h2>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-stone-200 bg-stone-50/80 px-5 pt-2">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === 'details'
                    ? 'border-[#991B1B] text-[#991B1B]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Event Overview & Discussions</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('attendees')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === 'attendees'
                    ? 'border-[#991B1B] text-[#991B1B]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Attendees & Guest Roster ({activeEvent.attendeesCount || (activeEvent.attendees ? activeEvent.attendees.length : 0)})</span>
              </button>
            </div>

            {/* Tab 1: Details & Discussions */}
            {modalTab === 'details' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Event Metadata */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <div>
                    <span className="text-stone-400 block">Date & Time</span>
                    <span className="font-semibold text-stone-800">
                      {new Date(activeEvent.startDate).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Location / Platform</span>
                    <span className="font-semibold text-stone-800">
                      {activeEvent.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Organized By</span>
                    <span className="font-semibold text-stone-800">
                      {activeEvent.createdByName || 'University Alumni Board'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Attending</span>
                    <span className="font-semibold text-blue-700">
                      {activeEvent.attendeesCount} / {activeEvent.maxAttendees} max
                    </span>
                  </div>
                </div>

                {/* Attendance & RSVP Status Box */}
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Your Attendance Status
                    </div>
                    <div className="text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                      {activeEvent.userRsvp === 'going' ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <Check className="w-4 h-4 text-emerald-600" />
                          You are confirmed as Going
                        </span>
                      ) : activeEvent.userRsvp === 'interested' ? (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          You marked this event as Interested
                        </span>
                      ) : (
                        <span className="text-stone-500">
                          You have not RSVP’d yet
                        </span>
                      )}
                      <span className="text-stone-300">•</span>
                      <span className="text-[10px] text-stone-400 font-normal">Real-time RSVP sync</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => rsvpEvent(activeEvent.id, 'going')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        activeEvent.userRsvp === 'going'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{activeEvent.userRsvp === 'going' ? 'Attending (Click to Cancel)' : 'RSVP: Going'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => rsvpEvent(activeEvent.id, 'interested')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        activeEvent.userRsvp === 'interested'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Interested</span>
                    </button>

                    {activeEvent.groupChatId && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatId(activeEvent.groupChatId!);
                          setActiveTab('messages');
                          setSelectedEventForDetail(null);
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-[#991B1B] border border-rose-200 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Open live coordination group chat for this event"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Event Group Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1.5">
                    About this Event
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {activeEvent.description}
                  </p>
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t border-stone-200">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
                    Alumni Discussions ({(activeEvent.comments || []).length})
                  </h3>

                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {(activeEvent.comments || []).length === 0 ? (
                      <p className="text-xs text-stone-400 italic">No comments yet. Start the conversation!</p>
                    ) : (
                      (activeEvent.comments || []).map((comm) => (
                        <div key={comm.id} className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-xl">
                          <img
                            src={comm.authorAvatar}
                            alt={comm.authorName}
                            className="w-7 h-7 rounded-full object-cover border border-stone-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-stone-900">{comm.authorName}</span>
                              <span className="text-[10px] text-stone-400">
                                {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-stone-700 mt-0.5">{comm.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Write a comment or ask a question..."
                      className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePostComment(activeEvent.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handlePostComment(activeEvent.id)}
                      className="px-4 py-2 bg-[#991B1B] hover:bg-[#7f1616] text-white text-xs font-semibold rounded-lg"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Dynamic Attendee List & Guest Roster */}
            {modalTab === 'attendees' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* RSVP Attendance Prompt Bar */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-700" />
                      <span>Your RSVP Status:</span>
                      <span className={`font-extrabold ${
                        activeEvent.userRsvp === 'going'
                          ? 'text-emerald-700'
                          : activeEvent.userRsvp === 'interested'
                          ? 'text-amber-700'
                          : 'text-stone-600'
                      }`}>
                        {activeEvent.userRsvp === 'going'
                          ? 'Confirmed Attending'
                          : activeEvent.userRsvp === 'interested'
                          ? 'Interested'
                          : 'Not RSVP’d yet'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Mark yourself as attending to let other alumni from your batch and program know you'll be there.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => rsvpEvent(activeEvent.id, 'going')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        activeEvent.userRsvp === 'going'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{activeEvent.userRsvp === 'going' ? 'Attending ✓' : 'I am Going'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => rsvpEvent(activeEvent.id, 'interested')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        activeEvent.userRsvp === 'interested'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Interested</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Controls for Attendees */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={attendeeSearchQuery}
                      onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                      placeholder="Search attendees by name, batch, course..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#991B1B]"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setAttendeeStatusFilter('all')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        attendeeStatusFilter === 'all'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      All ({(activeEvent.attendees || []).length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendeeStatusFilter('going')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        attendeeStatusFilter === 'going'
                          ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Going ({((activeEvent.attendees || []).filter((a) => a.status === 'going')).length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendeeStatusFilter('interested')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        attendeeStatusFilter === 'interested'
                          ? 'bg-white text-amber-700 shadow-2xs font-bold'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Interested ({((activeEvent.attendees || []).filter((a) => a.status === 'interested')).length})
                    </button>
                  </div>
                </div>

                {/* Dynamic Attendees List */}
                {filteredAttendees.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200/70">
                    <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-stone-700">No attendees found</h4>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {attendeeSearchQuery ? 'Try adjusting your search criteria.' : 'Be the first alumnus to RSVP for this event!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredAttendees.map((att) => {
                      const isMe = att.uid === currentUser?.uid;
                      const userConnected = isConnected(att.uid);

                      return (
                        <div
                          key={att.uid}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isMe
                              ? 'bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-300/40'
                              : 'bg-stone-50/60 hover:bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div
                            className="flex items-center gap-3 cursor-pointer min-w-0"
                            onClick={() => setSelectedUserIdForModal(att.uid)}
                          >
                            <img
                              src={att.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                              alt={att.name}
                              className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-900 truncate hover:text-blue-600">
                                  {att.name}
                                </span>
                                {isMe && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 truncate flex items-center gap-1.5 mt-0.5">
                                {att.batch && <span>Batch {att.batch}</span>}
                                {att.batch && att.course && <span>•</span>}
                                {att.course && <span>{att.course}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                att.status === 'going'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {att.status === 'going' ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Going</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Interested</span>
                                </>
                              )}
                            </span>

                            {!isMe && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    getOrCreateChat(att.uid);
                                    setActiveTab('messages');
                                  }}
                                  title="Send direct message"
                                  className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                {!userConnected && (
                                  <button
                                    type="button"
                                    onClick={() => sendFriendRequest(att.uid)}
                                    title="Connect"
                                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-blue-600 transition-colors"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">
                {editingEventId ? 'Edit Event Details' : 'Create New Alumni Event'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 2026 Grand Alumni Homecoming & Tech Gala"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide event details, schedule, dress code, speaker lineup..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Event Category</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
                  >
                    <option value="reunion">Reunion</option>
                    <option value="networking">Networking</option>
                    <option value="workshop">Workshop</option>
                    <option value="webinar">Webinar</option>
                    <option value="social">Social Mixer</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Location / Platform *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Venue name or Zoom Link"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">
                  Event Banner Image (Upload or URL) *
                </label>

                {/* Drag and Drop Direct Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingHeroImage(true);
                  }}
                  onDragLeave={() => setIsDraggingHeroImage(false)}
                  onDrop={handleHeroFileDrop}
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all ${
                    isDraggingHeroImage
                      ? 'border-[#991B1B] bg-red-50/60 ring-2 ring-red-200'
                      : 'border-stone-300 bg-stone-50/70 hover:bg-stone-100/70'
                  }`}
                >
                  {formHeroImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-stone-200 bg-stone-100 max-h-48">
                      <img
                        src={formHeroImage}
                        alt="Event Banner Preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <label className="px-3 py-1.5 bg-white text-stone-800 rounded-lg text-xs font-bold hover:bg-stone-100 cursor-pointer shadow-sm flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-stone-600" />
                          <span>Replace Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleHeroFileInput}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormHeroImage('')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                      <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mb-2 shadow-2xs">
                        <Upload className="w-5 h-5 text-stone-600" />
                      </div>
                      <span className="text-xs font-bold text-stone-800">
                        Drag & Drop event banner image here
                      </span>
                      <span className="text-[11px] text-stone-500 mt-0.5">
                        or click to browse local image files (PNG, JPG, WebP)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleHeroFileInput}
                      />
                    </label>
                  )}
                </div>

                {/* Optional Image URL Input */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={formHeroImage}
                    onChange={(e) => setFormHeroImage(e.target.value)}
                    placeholder="Or paste an image web URL: https://..."
                    className="flex-1 px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  {formHeroImage && (
                    <button
                      type="button"
                      onClick={() => setFormHeroImage('')}
                      className="px-2 py-1.5 text-xs text-stone-500 hover:text-red-600 hover:bg-stone-100 rounded-lg"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={formIsVirtual}
                    onChange={(e) => setFormIsVirtual(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Virtual Event</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={formIsImportant}
                    onChange={(e) => setFormIsImportant(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Flag as Important</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingEventId ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* SIDE-PANEL / HOVERING COMMENT SYSTEM */}
      {sidePanelEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSidePanelEventId(null)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-10 border-l border-stone-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-red-50 text-[#8B181B] shrink-0 border border-red-100">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-stone-900 truncate">
                    {sidePanelEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                    <span className="capitalize font-semibold text-[#8B181B]">
                      {sidePanelEvent.type}
                    </span>
                    <span>•</span>
                    <span>{(sidePanelEvent.comments || []).length} Comments</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventForDetail(sidePanelEvent);
                    setSidePanelEventId(null);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View full event details"
                >
                  Full Details ↗
                </button>
                <button
                  type="button"
                  onClick={() => setSidePanelEventId(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                  title="Close comments drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comments Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(sidePanelEvent.comments || []).length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">No Comments Yet</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    Be the first to share questions, ask about tickets, or coordinate reunion meetups with fellow alumni!
                  </p>
                </div>
              ) : (
                (sidePanelEvent.comments || []).map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={comm.authorAvatar}
                          alt={comm.authorName}
                          className="w-6 h-6 rounded-full object-cover border border-stone-200"
                        />
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {comm.authorName}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 shrink-0">
                        {new Date(comm.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed pl-8 break-words">
                      {comm.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Comment Form */}
            <form
              onSubmit={handleSidePanelCommentSubmit}
              className="p-3.5 border-t border-stone-200 bg-stone-50/70 flex items-center gap-2"
            >
              <input
                type="text"
                value={sidePanelCommentInput}
                onChange={(e) => setSidePanelCommentInput(e.target.value)}
                placeholder="Write a comment, question, or greeting..."
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991B1B] focus:border-[#991B1B]"
              />
              <button
                type="submit"
                disabled={!sidePanelCommentInput.trim()}
                className="px-4 py-2 bg-[#991B1B] hover:bg-[#7f1616] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cross-App Share Modal */}
      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        item={shareItem || { title: '' }}
      />
    </div>
  );
};

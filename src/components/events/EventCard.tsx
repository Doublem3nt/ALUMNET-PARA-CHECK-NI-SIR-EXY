import React from 'react';
import {
  Clock,
  MapPin,
  Users,
  Heart,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { AlumniEvent } from '../../types';
import { ShareButton } from '../common/ShareButton';

interface EventCardProps {
  event: AlumniEvent;
  currentUserId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onSelect: (event: AlumniEvent) => void;
  onOpenAttendees: (event: AlumniEvent) => void;
  onEdit?: (event: AlumniEvent) => void;
  onDelete?: (eventId: string) => void;
  onToggleLike: (eventId: string) => void;
  isExpandedThread?: boolean;
  onToggleExpandThread?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  currentUserId,
  canEdit,
  canDelete,
  onSelect,
  onOpenAttendees,
  onEdit,
  onDelete,
  onToggleLike,
  isExpandedThread,
  onToggleExpandThread
}) => {
  const eventDate = new Date(event.startDate);
  const isLiked = currentUserId ? (event.likes || []).includes(currentUserId) : false;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alumni.stcecilia.edu';
  const shareUrl = `${origin}?tab=events&event=${event.id}`;
  const shareText = `${event.title} — scheduled for ${eventDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })} at ${event.location}. Join the St. Cecilia's College Alumni Network!`;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Card Header Media */}
        <div className="relative h-44 sm:h-48 w-full bg-stone-100 overflow-hidden">
          <img
            src={
              event.heroImageUrl ||
              'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80'
            }
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Date Badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl shadow-xs text-center border border-stone-100">
            <span className="block text-[10px] font-bold text-red-700 uppercase leading-none">
              {eventDate.toLocaleDateString([], { month: 'short' })}
            </span>
            <span className="block text-base font-extrabold text-stone-900 leading-none mt-0.5">
              {eventDate.getDate()}
            </span>
          </div>

          {/* Virtual / Important Tag */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            {event.isVirtual && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-600/90 text-white backdrop-blur-xs">
                Virtual
              </span>
            )}
            {event.isImportant && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/90 text-white backdrop-blur-xs">
                Featured
              </span>
            )}
          </div>

          {/* Edit / Delete Controls */}
          {(canEdit || canDelete) && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs rounded-lg p-1 border border-stone-200">
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                  className="p-1 hover:text-blue-600 text-stone-600 rounded"
                  title="Edit Event"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this event?')) onDelete(event.id);
                  }}
                  className="p-1 hover:text-red-600 text-stone-600 rounded"
                  title="Delete Event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-4">
          <div className="text-[11px] font-semibold text-[#8B181B] uppercase tracking-wider mb-1">
            {event.type}
          </div>

          <h3
            onClick={() => onSelect(event)}
            className="text-base font-bold text-stone-900 hover:text-[#8B181B] cursor-pointer line-clamp-2 leading-snug"
          >
            {event.title}
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
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          <p className="text-xs text-stone-600 mt-2.5 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>
      </div>

      {/* Footer Controls: Attendees, Share, Likes */}
      <div className="p-4 pt-3 bg-stone-50/60 border-t border-stone-100">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <button
            type="button"
            onClick={() => onOpenAttendees(event)}
            className="flex items-center gap-1.5 hover:text-[#8B181B] transition-colors group text-left"
            title="Click to view full attendee roster"
          >
            <div className="flex -space-x-1.5 overflow-hidden py-0.5">
              {(event.attendees && event.attendees.length > 0 ? event.attendees.slice(0, 3) : []).map(
                (att, i) => (
                  <img
                    key={att.uid || i}
                    src={
                      att.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={att.name}
                    className="inline-block h-5 w-5 rounded-full ring-1 ring-white object-cover shadow-2xs"
                  />
                )
              )}
            </div>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#8B181B]" />
              <span className="font-bold text-stone-800 group-hover:text-[#8B181B]">
                {event.attendeesCount}
              </span>
              <span className="underline decoration-dotted text-[11px] text-stone-500 group-hover:text-[#8B181B]">
                attendees
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            {/* Integrated Share Button using Web Share API */}
            <ShareButton
              title={event.title}
              text={shareText}
              url={shareUrl}
              variant="icon"
              className="p-1 text-stone-500 hover:text-[#8B181B] hover:bg-stone-200/60"
            />

            <button
              type="button"
              onClick={() => onToggleLike(event.id)}
              className={`flex items-center gap-1 text-xs transition-colors p-1 rounded ${
                isLiked ? 'text-red-600 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Like Event"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-600' : ''}`} />
              <span>{(event.likes || []).length}</span>
            </button>

            {onToggleExpandThread && (
              <button
                type="button"
                onClick={() => onToggleExpandThread(event.id)}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 p-1 rounded transition-colors"
                title="View discussion"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{(event.comments || []).length}</span>
                {isExpandedThread ? (
                  <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

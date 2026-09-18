import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Announcement } from '../../types';
import { ShareButton } from '../common/ShareButton';

interface AnnouncementCardProps {
  announcement: Announcement;
  canDelete?: boolean;
  onSelect: (announcement: Announcement) => void;
  onDelete?: (announcementId: string) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  canDelete,
  onSelect,
  onDelete
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alumni.stcecilia.edu';
  const shareUrl = `${origin}?tab=announcements&id=${announcement.id}`;
  const shareText = `${announcement.title} — Official Institutional Announcement from St. Cecilia's College: ${announcement.content.slice(
    0,
    160
  )}...`;

  return (
    <div
      onClick={() => onSelect(announcement)}
      className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {announcement.isImportant && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-md flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Important Notice
              </span>
            )}
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-700 rounded-md uppercase">
              {announcement.category}
            </span>
            <span className="text-xs text-stone-400">
              {new Date(announcement.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Integrated Share Button using Web Share API */}
            <ShareButton
              title={announcement.title}
              text={shareText}
              url={shareUrl}
              variant="icon"
              className="p-1.5 text-stone-400 hover:text-[#8B181B] hover:bg-stone-100 rounded-lg"
            />

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this announcement?')) {
                    onDelete(announcement.id);
                  }
                }}
                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded-lg transition-colors"
                title="Delete Announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-stone-900 mt-2.5 group-hover:text-[#8B181B] transition-colors leading-snug">
          {announcement.title}
        </h2>

        <p className="text-xs sm:text-sm text-stone-600 mt-2 line-clamp-3 leading-relaxed">
          {announcement.content}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-800">{announcement.authorName}</span>
          <span>•</span>
          <span className="uppercase text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-medium">
            {announcement.authorRole}
          </span>
        </div>

        <span className="text-[#8B181B] font-semibold text-xs group-hover:underline">
          Read full notice &rarr;
        </span>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  UserPlus,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  CalendarCheck,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Info,
  X
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserProfile, ChatThread, ChatMessage } from '../../types';
import { EventEmailNotificationInbox } from './EventEmailNotificationInbox';

export const MessagesView: React.FC = () => {
  const {
    currentUser,
    users,
    chats,
    messages,
    events,
    sendMessage,
    activeChatId,
    setActiveChatId,
    markChatAsRead,
    getOrCreateChat,
    setSelectedUserIdForModal,
    setActiveTab
  } = useAlumni();

  const [messageViewMode, setMessageViewMode] = useState<'chats' | 'event_emails'>('chats');
  const [chatTypeFilter, setChatTypeFilter] = useState<'all' | 'direct' | 'events'>('all');
  const [inputMessage, setInputMessage] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [contactDirectorySearch, setContactDirectorySearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'verified' | 'faculty' | 'classmates'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active chat object - Isolated to currentUser's conversations
  const activeChat = useMemo(() => {
    if (!activeChatId || !currentUser?.uid) return null;
    const found = chats.find((c) => c.id === activeChatId && c.memberIds.includes(currentUser.uid));
    return found || null;
  }, [chats, activeChatId, currentUser?.uid]);

  // The other member in a direct 1-on-1 conversation
  const recipientUser = useMemo(() => {
    if (!activeChat || !currentUser || activeChat.isGroupChat || activeChat.isEventChat) return null;
    const otherId = activeChat.memberIds.find((id) => id !== currentUser.uid);
    return users.find((u) => u.uid === otherId) || null;
  }, [activeChat, currentUser, users]);

  // Associated event for active event group chat
  const activeEvent = useMemo(() => {
    if (!activeChat?.eventId) return null;
    return events.find((e) => e.id === activeChat.eventId) || null;
  }, [activeChat, events]);

  // Group members profile list
  const activeGroupMembers = useMemo(() => {
    if (!activeChat) return [];
    return activeChat.memberIds
      .map((mId) => users.find((u) => u.uid === mId))
      .filter((u): u is UserProfile => Boolean(u));
  }, [activeChat, users]);

  // Current chat messages
  const activeChatMessages = useMemo(() => {
    if (!activeChat) return [];
    return messages[activeChat.id] || [];
  }, [activeChat, messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  // Mark active chat as read when opened
  useEffect(() => {
    if (activeChat) {
      markChatAsRead(activeChat.id);
    }
  }, [activeChat?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;
    sendMessage(activeChat.id, inputMessage);
    setInputMessage('');
  };

  // Filtered chats list: supports both 1-on-1 chats and event group chats
  const filteredChats = useMemo(() => {
    if (!currentUser?.uid) return [];
    return chats.filter((c) => {
      if (!c.memberIds.includes(currentUser.uid)) return false;

      // Filter by type tab
      const isEventOrGroup = c.isGroupChat || c.isEventChat;
      if (chatTypeFilter === 'direct' && isEventOrGroup) return false;
      if (chatTypeFilter === 'events' && !isEventOrGroup) return false;

      // Filter by search query
      if (!chatSearch.trim()) return true;
      const q = chatSearch.toLowerCase();

      if (isEventOrGroup) {
        return (
          (c.groupName && c.groupName.toLowerCase().includes(q)) ||
          (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
        );
      }

      const otherId = c.memberIds.find((id) => id !== currentUser.uid);
      const other = users.find((u) => u.uid === otherId);
      if (!other) return false;
      return (
        other.name.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    });
  }, [chats, users, currentUser, chatTypeFilter, chatSearch]);

  // Counts for chat tabs
  const chatCounts = useMemo(() => {
    if (!currentUser) return { all: 0, direct: 0, events: 0 };
    const myChats = chats.filter((c) => c.memberIds.includes(currentUser.uid));
    const eventsCount = myChats.filter((c) => c.isGroupChat || c.isEventChat).length;
    const directCount = myChats.filter((c) => !c.isGroupChat && !c.isEventChat).length;
    return { all: myChats.length, direct: directCount, events: eventsCount };
  }, [chats, currentUser]);

  // Count unread direct messages
  const totalUnreadChats = useMemo(() => {
    if (!currentUser) return 0;
    return chats.reduce((acc, chat) => {
      return acc + (chat.unreadCount?.[currentUser.uid] || 0);
    }, 0);
  }, [chats, currentUser]);

  // Count registered events for current user
  const userRegisteredEventsCount = useMemo(() => {
    if (!currentUser) return 0;
    return events.filter(
      (e) =>
        e.userRsvp === 'going' ||
        e.userRsvp === 'interested' ||
        e.attendees?.some((a) => a.uid === currentUser.uid && a.status !== 'not_going')
    ).length;
  }, [events, currentUser]);

  // Contact directory list for empty state when no active chat thread is chosen
  const directoryContacts = useMemo(() => {
    if (!currentUser) return [];
    return users.filter((u) => {
      if (u.uid === currentUser.uid) return false;
      if (contactFilter === 'verified' && !u.isVerified && !u.verified) return false;
      if (contactFilter === 'faculty' && !['staff', 'registrar', 'admin'].includes(u.role)) return false;
      if (contactFilter === 'classmates' && (u.batch !== currentUser.batch || u.role !== 'alumni')) return false;

      if (!contactDirectorySearch.trim()) return true;
      const q = contactDirectorySearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        (u.course && u.course.toLowerCase().includes(q)) ||
        (u.batch && u.batch.includes(q)) ||
        (u.companyName && u.companyName.toLowerCase().includes(q)) ||
        (u.currentJobTitle && u.currentJobTitle.toLowerCase().includes(q))
      );
    });
  }, [users, currentUser, contactFilter, contactDirectorySearch]);

  return (
    <div className="space-y-3">
      {/* Top Communication Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="bg-white p-1 rounded-xl border border-stone-200 shadow-2xs inline-flex items-center gap-1">
          <button
            onClick={() => setMessageViewMode('chats')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              messageViewMode === 'chats'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messaging Hub</span>
            {totalUnreadChats > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-stone-900">
                {totalUnreadChats}
              </span>
            )}
          </button>

          <button
            onClick={() => setMessageViewMode('event_emails')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              messageViewMode === 'event_emails'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Official Event Notifications</span>
            {userRegisteredEventsCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {userRegisteredEventsCount} Active
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-stone-100 text-stone-500">
                Mailbox
              </span>
            )}
          </button>
        </div>

        {messageViewMode === 'event_emails' && (
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real-time email dispatches for verified registrations</span>
          </div>
        )}
      </div>

      {/* Primary Communication Container */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden h-[calc(100vh-14rem)] min-h-[520px] flex">
        {messageViewMode === 'event_emails' ? (
          <EventEmailNotificationInbox />
        ) : (
          <>
            {/* LEFT COLUMN: Chat list */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-stone-200 flex flex-col shrink-0 ${
                activeChatId ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Header with Search and New Message button */}
              <div className="p-3.5 border-b border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Conversations</span>
                  </h2>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 border border-blue-200 cursor-pointer"
                    title="Start conversation with any alumnus or staff"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>New Chat</span>
                  </button>
                </div>

                {/* Filter Tabs: All, Direct, Event Groups */}
                <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg text-[11px] font-medium">
                  <button
                    onClick={() => setChatTypeFilter('all')}
                    className={`flex-1 py-1 rounded-md transition-all text-center cursor-pointer ${
                      chatTypeFilter === 'all'
                        ? 'bg-white text-stone-900 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({chatCounts.all})
                  </button>
                  <button
                    onClick={() => setChatTypeFilter('direct')}
                    className={`flex-1 py-1 rounded-md transition-all text-center cursor-pointer ${
                      chatTypeFilter === 'direct'
                        ? 'bg-white text-stone-900 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Direct ({chatCounts.direct})
                  </button>
                  <button
                    onClick={() => setChatTypeFilter('events')}
                    className={`flex-1 py-1 rounded-md transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                      chatTypeFilter === 'events'
                        ? 'bg-white text-[#991B1B] font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Events ({chatCounts.events})</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search messages or event groups..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
                {filteredChats.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400">
                    No conversations found. Join an event or click "New Chat" to connect.
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const isSelected = activeChat?.id === chat.id;
                    const unread = currentUser && chat.unreadCount ? chat.unreadCount[currentUser.uid] || 0 : 0;
                    const isEventOrGroup = chat.isGroupChat || chat.isEventChat;

                    if (isEventOrGroup) {
                      return (
                        <div
                          key={chat.id}
                          onClick={() => {
                            setActiveChatId(chat.id);
                            markChatAsRead(chat.id);
                          }}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50/60 border-l-4 border-l-[#991B1B]' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#991B1B] to-amber-700 text-white flex items-center justify-center shadow-2xs shrink-0">
                            <CalendarCheck className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="text-xs font-bold text-stone-900 truncate">
                                {chat.groupName || 'Event Group Chat'}
                              </h3>
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {new Date(chat.lastMessageAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-stone-500 truncate mt-0.5">{chat.lastMessage}</p>

                            <div className="flex items-center justify-between mt-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#991B1B] bg-rose-50 px-1.5 py-0.5 rounded">
                                <Users className="w-2.5 h-2.5" />
                                <span>{chat.memberIds.length} Members</span>
                              </span>
                              {unread > 0 && (
                                <span className="px-1.5 py-0.2 bg-[#991B1B] text-white rounded-full text-[10px] font-bold">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Direct 1-on-1 Chat
                    const otherId = (chat.memberIds || []).find((id) => id !== currentUser?.uid);
                    const other = users.find((u) => u.uid === otherId);

                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          setActiveChatId(chat.id);
                          markChatAsRead(chat.id);
                        }}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={other?.profilePictureUrl}
                            alt={other?.name}
                            className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="text-xs font-bold text-stone-900 truncate">{other?.name}</h3>
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {new Date(chat.lastMessageAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-stone-500 truncate mt-0.5">{chat.lastMessage}</p>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-stone-400 font-medium truncate">
                              {other?.course || other?.role.toUpperCase()}
                            </span>
                            {unread > 0 && (
                              <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Active Chat Conversation */}
            <div className={`flex-1 flex flex-col bg-stone-50/40 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
              {activeChat ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-3.5 sm:p-4 bg-white border-b border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveChatId(null)}
                        className="md:hidden p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      {activeChat.isGroupChat || activeChat.isEventChat ? (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#991B1B] to-amber-700 text-white flex items-center justify-center shadow-xs shrink-0">
                          <CalendarCheck className="w-5 h-5" />
                        </div>
                      ) : (
                        <img
                          src={recipientUser?.profilePictureUrl}
                          alt={recipientUser?.name}
                          onClick={() => recipientUser && setSelectedUserIdForModal(recipientUser.uid)}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200 cursor-pointer"
                        />
                      )}

                      <div>
                        {activeChat.isGroupChat || activeChat.isEventChat ? (
                          <>
                            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{activeChat.groupName || 'Event Group Chat'}</span>
                              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-rose-100 text-[#991B1B]">
                                Event Group
                              </span>
                            </h3>
                            <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3 text-stone-400" />
                              <span>Official Coordination • {activeChat.memberIds.length} RSVP'd Attendees</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <h3
                              onClick={() => recipientUser && setSelectedUserIdForModal(recipientUser.uid)}
                              className="text-sm font-bold text-stone-900 hover:text-blue-600 cursor-pointer"
                            >
                              {recipientUser?.name}
                            </h3>
                            <p className="text-xs text-stone-500">
                              Batch of {recipientUser?.batch} • {recipientUser?.course}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeChat.isGroupChat || activeChat.isEventChat ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowMembersModal(true)}
                            className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer flex items-center gap-1.5"
                          >
                            <Users className="w-3.5 h-3.5 text-stone-500" />
                            <span>{activeChat.memberIds.length} Members</span>
                          </button>

                          {activeEvent && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('events')}
                              className="px-2.5 py-1 text-xs font-semibold text-[#991B1B] bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer flex items-center gap-1 border border-rose-200"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Event</span>
                            </button>
                          )}
                        </>
                      ) : (
                        recipientUser && (
                          <button
                            onClick={() => setSelectedUserIdForModal(recipientUser.uid)}
                            className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                          >
                            View Profile
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    <div className="text-center my-2">
                      <span className="px-3 py-1 bg-stone-200/60 rounded-full text-[10px] font-medium text-stone-600">
                        {activeChat.isGroupChat || activeChat.isEventChat
                          ? 'Official Event Group Chat • End-to-end coordinated conversation'
                          : 'Secure peer-to-peer alumni chat'}
                      </span>
                    </div>

                    {activeChatMessages.length === 0 ? (
                      <div className="text-center py-12 text-xs text-stone-400">
                        No messages yet. Send a greeting to start chatting!
                      </div>
                    ) : (
                      activeChatMessages.map((msg) => {
                        // System messages styling
                        if (msg.isSystemMessage) {
                          return (
                            <div key={msg.id} className="flex justify-center my-2">
                              <div className="px-3.5 py-1.5 rounded-full bg-amber-50/80 border border-amber-200/70 text-[11px] font-medium text-stone-700 flex items-center gap-1.5 shadow-2xs max-w-lg text-center">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{msg.text}</span>
                              </div>
                            </div>
                          );
                        }

                        const isMine = msg.senderId === currentUser?.uid;
                        const sender = !isMine ? users.find((u) => u.uid === msg.senderId) : null;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                          >
                            {/* In group chats, display sender info for other participants */}
                            {(activeChat.isGroupChat || activeChat.isEventChat) && !isMine && (
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <img
                                  src={msg.senderAvatar || sender?.profilePictureUrl}
                                  alt={msg.senderName || sender?.name}
                                  onClick={() => sender && setSelectedUserIdForModal(sender.uid)}
                                  className="w-4 h-4 rounded-full object-cover cursor-pointer"
                                />
                                <span
                                  onClick={() => sender && setSelectedUserIdForModal(sender.uid)}
                                  className="text-[11px] font-bold text-stone-800 hover:text-blue-600 cursor-pointer"
                                >
                                  {msg.senderName || sender?.name || 'Participant'}
                                </span>
                                {(msg.senderRole || sender?.role) && (
                                  <span className="text-[9px] font-bold uppercase px-1 py-0.2 bg-stone-100 text-stone-500 rounded">
                                    {msg.senderRole || sender?.role}
                                  </span>
                                )}
                              </div>
                            )}

                            <div
                              className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isMine
                                  ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                                  : 'bg-white border border-stone-200 text-stone-900 rounded-bl-xs shadow-2xs'
                              }`}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[10px] text-stone-400 mt-1 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Bar */}
                  <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-stone-200 flex items-center gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={
                        activeChat.isGroupChat || activeChat.isEventChat
                          ? `Message ${activeChat.groupName || 'event attendees'}...`
                          : `Message ${recipientUser?.name || 'alumnus'}...`
                      }
                      className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col bg-white overflow-y-auto">
                  {/* Contact Directory Header */}
                  <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                          <Users className="w-3.5 h-3.5" />
                          <span>Alumni & Staff Contact Directory</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 mt-1">
                          Direct Peer & Faculty Messaging
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Select a conversation from the left, or choose an alumnus or faculty member below to open a private thread.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowNewChatModal(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>New Chat</span>
                      </button>
                    </div>

                    {/* Search & Filter Controls */}
                    <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={contactDirectorySearch}
                          onChange={(e) => setContactDirectorySearch(e.target.value)}
                          placeholder="Search contacts by name, degree, batch, or company..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 p-0.5 bg-stone-200/60 rounded-lg overflow-x-auto text-[11px] font-medium shrink-0">
                        <button
                          onClick={() => setContactFilter('all')}
                          className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                            contactFilter === 'all'
                              ? 'bg-white text-stone-900 shadow-2xs font-bold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          All ({users.length - 1})
                        </button>
                        <button
                          onClick={() => setContactFilter('verified')}
                          className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                            contactFilter === 'verified'
                              ? 'bg-white text-stone-900 shadow-2xs font-bold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Verified
                        </button>
                        <button
                          onClick={() => setContactFilter('classmates')}
                          className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                            contactFilter === 'classmates'
                              ? 'bg-white text-stone-900 shadow-2xs font-bold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Batch {currentUser?.batch}
                        </button>
                        <button
                          onClick={() => setContactFilter('faculty')}
                          className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                            contactFilter === 'faculty'
                              ? 'bg-white text-stone-900 shadow-2xs font-bold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Faculty / Staff
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Directory Grid */}
                  <div className="p-4 overflow-y-auto flex-1">
                    {directoryContacts.length === 0 ? (
                      <div className="text-center py-12 text-stone-400">
                        <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-stone-600">No alumni or faculty found</p>
                        <p className="text-[11px] text-stone-400 mt-1">Try adjusting your search criteria or filter.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {directoryContacts.map((contact) => (
                          <div
                            key={contact.uid}
                            className="p-3 rounded-xl border border-stone-200 bg-white hover:border-blue-300 hover:shadow-2xs transition-all flex items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={contact.profilePictureUrl}
                                alt={contact.name}
                                onClick={() => setSelectedUserIdForModal(contact.uid)}
                                className="w-9 h-9 rounded-full object-cover border border-stone-200 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <h4
                                    onClick={() => setSelectedUserIdForModal(contact.uid)}
                                    className="text-xs font-bold text-stone-900 hover:text-blue-600 cursor-pointer truncate"
                                  >
                                    {contact.name}
                                  </h4>
                                  {(contact.isVerified || contact.verified) && (
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Registrar Verified Alumnus" />
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-500 truncate">
                                  {contact.course || contact.role.toUpperCase()} • {contact.batch}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => getOrCreateChat(contact.uid)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Send className="w-3 h-3" />
                              <span>Chat</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Group Chat Members Modal */}
      {showMembersModal && activeChat && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#991B1B]" />
                <h3 className="text-sm font-bold text-stone-900">
                  Event Group Members ({activeChat.memberIds.length})
                </h3>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 my-2.5">
              All RSVP'd attendees and organizers automatically added to this conversation:
            </p>

            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
              {activeGroupMembers.map((member) => (
                <div key={member.uid} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.profilePictureUrl}
                      alt={member.name}
                      onClick={() => {
                        setShowMembersModal(false);
                        setSelectedUserIdForModal(member.uid);
                      }}
                      className="w-9 h-9 rounded-full object-cover border border-stone-200 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          onClick={() => {
                            setShowMembersModal(false);
                            setSelectedUserIdForModal(member.uid);
                          }}
                          className="text-xs font-bold text-stone-900 hover:text-blue-600 cursor-pointer truncate"
                        >
                          {member.name}
                        </span>
                        {member.uid === currentUser?.uid && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 truncate">
                        {member.course || member.role.toUpperCase()} • Batch {member.batch}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowMembersModal(false);
                      setSelectedUserIdForModal(member.uid);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Start a Conversation</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 my-3">
              Select any alumni, faculty, or staff member to begin direct messaging:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {users
                .filter((u) => u.uid !== currentUser?.uid)
                .map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => {
                      getOrCreateChat(u.uid);
                      setShowNewChatModal(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 border border-stone-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profilePictureUrl}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-stone-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{u.name}</h4>
                        <p className="text-[11px] text-stone-500">
                          {u.role.toUpperCase()} • Batch {u.batch}
                        </p>
                        <p className="text-[10px] text-stone-400 line-clamp-1">{u.headline}</p>
                      </div>
                    </div>
                    <button className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold cursor-pointer">
                      Chat
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

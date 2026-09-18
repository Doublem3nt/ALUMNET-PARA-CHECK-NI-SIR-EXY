import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  UserCheck,
  UserPlus,
  Clock,
  Check,
  X,
  MapPin,
  Building,
  GraduationCap,
  Filter,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserProfile } from '../../types';

export const NetworkView: React.FC = () => {
  const {
    currentUser,
    users,
    friendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    sendFriendRequest,
    isConnected,
    hasPendingRequestWith,
    connectionIds,
    getOrCreateChat,
    setActiveTab,
    setSelectedUserIdForModal,
    permissions
  } = useAlumni();

  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'recommended' | 'connections' | 'requests'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Distinct batches and courses for filter chips
  const allBatches = useMemo(() => {
    const batches = Array.from(new Set(users.map((u) => u.batch).filter(Boolean)));
    return ['all', ...batches.sort().reverse()];
  }, [users]);

  const allCourses = useMemo(() => {
    const courses = Array.from(new Set(users.map((u) => u.course).filter(Boolean)));
    return ['all', ...courses.sort()];
  }, [users]);

  // Received and Sent Requests
  const receivedRequests = useMemo(() => {
    return friendRequests
      .filter((r) => r.toUid === currentUser?.uid && r.status === 'pending')
      .map((r) => ({
        request: r,
        user: users.find((u) => u.uid === r.fromUid)
      }))
      .filter((item): item is { request: typeof item.request; user: UserProfile } => Boolean(item.user));
  }, [friendRequests, currentUser, users]);

  const sentRequests = useMemo(() => {
    return friendRequests
      .filter((r) => r.fromUid === currentUser?.uid && r.status === 'pending')
      .map((r) => ({
        request: r,
        user: users.find((u) => u.uid === r.toUid)
      }))
      .filter((item): item is { request: typeof item.request; user: UserProfile } => Boolean(item.user));
  }, [friendRequests, currentUser, users]);

  // Connections List
  const connectedUsers = useMemo(() => {
    return users.filter((u) => connectionIds.includes(u.uid));
  }, [users, connectionIds]);

  // Recommended Friends / People You May Know
  const recommendedUsers = useMemo(() => {
    if (!currentUser) return [];
    return users.filter((u) => {
      if (u.uid === currentUser.uid) return false;
      if (connectionIds.includes(u.uid)) return false;
      const sameBatch = u.batch && currentUser.batch && u.batch === currentUser.batch;
      const sameCourse = u.course && currentUser.course && u.course.toLowerCase() === currentUser.course.toLowerCase();
      const sameLocation = u.location && currentUser.location && u.location.toLowerCase().includes(currentUser.location.toLowerCase());
      return sameBatch || sameCourse || sameLocation;
    });
  }, [users, currentUser, connectionIds]);

  // Filtered Directory - fully findable across all attributes
  const filteredDirectory = useMemo(() => {
    return users.filter((u) => {
      // Exclude self if logged in
      if (currentUser?.uid && u.uid === currentUser.uid) return false;

      const q = searchQuery.toLowerCase().trim();
      const isAllAlumniQuery =
        q === 'all' ||
        q === 'all alumni' ||
        q === 'alumni' ||
        q === 'alumnus' ||
        q === 'all graduates' ||
        q === 'graduates';

      const matchesSearch =
        !q ||
        (isAllAlumniQuery && (u.role === 'alumni' || u.role === 'student' || !u.role)) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.course || '').toLowerCase().includes(q) ||
        (u.headline || '').toLowerCase().includes(q) ||
        (u.location || '').toLowerCase().includes(q) ||
        (u.batch || '').includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.studentId || '').toLowerCase().includes(q) ||
        (u.employeeId || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.about || '').toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q) ||
        (u.currentPosition || '').toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.skills || []).some((s) => s.toLowerCase().includes(q)) ||
        (u.experience || []).some(
          (e) =>
            (e.company || '').toLowerCase().includes(q) ||
            (e.title || '').toLowerCase().includes(q) ||
            (e.description || '').toLowerCase().includes(q)
        ) ||
        (u.education || []).some(
          (ed) =>
            (ed.degree || '').toLowerCase().includes(q) ||
            (ed.fieldOfStudy || '').toLowerCase().includes(q) ||
            (ed.institution || '').toLowerCase().includes(q)
        );

      const matchesBatch = selectedBatch === 'all' || u.batch === selectedBatch;
      const matchesCourse = selectedCourse === 'all' || u.course === selectedCourse;
      const matchesRole =
        selectedRole === 'all' ||
        u.role === selectedRole ||
        (selectedRole === 'alumni' && (u.role === 'alumni' || !u.role));

      return matchesSearch && matchesBatch && matchesCourse && matchesRole;
    });
  }, [users, currentUser, searchQuery, selectedBatch, selectedCourse, selectedRole]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Policy Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Alumni Directory & Network
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Search and connect with over 85,000 verified university graduates worldwide.
            </p>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'directory'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Directory (View All)</span>
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                {filteredDirectory.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('recommended')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'recommended'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Recommended Friends</span>
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold">
                {recommendedUsers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('connections')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'connections'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>My Network</span>
              <span className="px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-full text-[10px]">
                {connectedUsers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('requests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'requests'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Requests</span>
              {receivedRequests.length > 0 && (
                <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
                  {receivedRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Networking Policy Banner */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-600">
          <span className="font-semibold text-blue-700 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Alumni Network:
          </span>
          <span>
            Connect with alumni, batchmates, and campus community members to expand your professional network and send direct messages.
          </span>
        </div>
      </div>

      {/* TAB 1: DIRECTORY SEARCH */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filters Controls */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alumni by name, field of study, company, batch, or city..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="alumni">Alumni Only</option>
                <option value="registrar">Registrar / Staff</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-hidden"
              >
                <option value="all">All Batches</option>
                {allBatches.filter((b) => b !== 'all').map((b) => (
                  <option key={b} value={b}>
                    Batch {b}
                  </option>
                ))}
              </select>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-hidden max-w-[180px] truncate"
              >
                <option value="all">All Disciplines</option>
                {allCourses.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {(searchQuery || selectedBatch !== 'all' || selectedCourse !== 'all' || selectedRole !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBatch('all');
                    setSelectedCourse('all');
                    setSelectedRole('all');
                  }}
                  className="px-2.5 py-2 text-xs font-medium text-stone-600 hover:text-red-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick Filter:
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('all');
                setSelectedBatch('all');
                setSelectedCourse('all');
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                !searchQuery && selectedRole === 'all' && selectedBatch === 'all' && selectedCourse === 'all'
                  ? 'bg-[#8B181B] text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All Alumni ({users.filter((u) => u.uid !== currentUser?.uid).length})
            </button>
            <button
              onClick={() => {
                setSelectedRole('alumni');
                setSearchQuery('');
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                selectedRole === 'alumni' && !searchQuery
                  ? 'bg-[#8B181B] text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Verified Alumni Only
            </button>
            <button
              onClick={() => setSearchQuery('Information Technology')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                searchQuery === 'Information Technology'
                  ? 'bg-[#8B181B] text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Info Technology
            </button>
            <button
              onClick={() => setSearchQuery('Computer Science')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                searchQuery === 'Computer Science'
                  ? 'bg-[#8B181B] text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Computer Science
            </button>
            <button
              onClick={() => setSearchQuery('Criminology')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                searchQuery === 'Criminology'
                  ? 'bg-[#8B181B] text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Criminology
            </button>
            <button
              onClick={() => setSearchQuery('Business')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                searchQuery === 'Business'
                  ? 'bg-[#8B181B] text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Business Admin
            </button>
            <button
              onClick={() => setSelectedBatch('2024')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                selectedBatch === '2024'
                  ? 'bg-[#8B181B] text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Batch 2024
            </button>
            <button
              onClick={() => setSelectedBatch('2023')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                selectedBatch === '2023'
                  ? 'bg-[#8B181B] text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Batch 2023
            </button>
          </div>

          {/* Directory Cards Grid */}
          {filteredDirectory.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-stone-200">
              <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">No alumni found</p>
              <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                No alumni match your current search query or filter criteria. Try searching with different keywords or reset your filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBatch('all');
                  setSelectedCourse('all');
                  setSelectedRole('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDirectory.map((user) => {
                const connected = isConnected(user.uid);
                const reqState = hasPendingRequestWith(user.uid);

                return (
                  <div
                    key={user.uid}
                    className="bg-white rounded-xl border border-stone-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <img
                          src={user.profilePictureUrl}
                          alt={user.name}
                          onClick={() => setSelectedUserIdForModal(user.uid)}
                          className="w-14 h-14 rounded-full object-cover border border-stone-200 cursor-pointer hover:opacity-90"
                        />
                        <span className="text-[11px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg">
                          Class of {user.batch || '2024'}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-1.5">
                          <h3
                            onClick={() => setSelectedUserIdForModal(user.uid)}
                            className="font-bold text-sm text-stone-900 hover:text-blue-600 cursor-pointer"
                          >
                            {user.name}
                          </h3>
                          {user.isVerified && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" title="Verified Alumni"></span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mt-0.5">
                          <span>Batch {user.batch}</span>
                          <span>•</span>
                          <span className="truncate">{user.course}</span>
                        </div>

                        <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {user.headline}
                        </p>

                        <div className="mt-2.5 flex items-center gap-1 text-[11px] text-stone-400">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{user.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserIdForModal(user.uid)}
                        className="flex-1 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200/70 bg-white border border-stone-200 rounded-lg text-center transition-colors"
                      >
                        View Profile
                      </button>

                      {connected ? (
                        <button
                          onClick={() => {
                            getOrCreateChat(user.uid);
                            setActiveTab('messages');
                          }}
                          className="flex-1 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      ) : reqState === 'sent' ? (
                        <button
                          onClick={() => {
                            const req = friendRequests.find(
                              (r) => r.fromUid === currentUser?.uid && r.toUid === user.uid && r.status === 'pending'
                            );
                            if (req) cancelFriendRequest(req.id);
                          }}
                          className="flex-1 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-red-50 hover:text-red-700 border border-amber-200 hover:border-red-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Click to cancel pending request"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                          <span>Pending (Cancel)</span>
                        </button>
                      ) : reqState === 'received' ? (
                        <button
                          onClick={() => setActiveSubTab('requests')}
                          className="flex-1 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Respond</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(user.uid)}
                          className="flex-1 py-1.5 text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] rounded-lg flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONNECTIONS */}
      {activeSubTab === 'connections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">Your Alumni Connections ({connectedUsers.length})</h2>
            <span className="text-xs text-stone-500">Mutual connections you can message directly</span>
          </div>

          {connectedUsers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-stone-200">
              <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">No connections yet</p>
              <p className="text-xs text-stone-400 mt-1">
                Browse the directory and send connection requests to your classmates.
              </p>
              <button
                onClick={() => setActiveSubTab('directory')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                Find Alumni
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedUsers.map((user) => (
                <div
                  key={user.uid}
                  className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePictureUrl}
                        alt={user.name}
                        onClick={() => setSelectedUserIdForModal(user.uid)}
                        className="w-12 h-12 rounded-full object-cover border border-stone-200 cursor-pointer"
                      />
                      <div>
                        <h3
                          onClick={() => setSelectedUserIdForModal(user.uid)}
                          className="font-bold text-sm text-stone-900 hover:text-blue-600 cursor-pointer"
                        >
                          {user.name}
                        </h3>
                        <p className="text-xs text-blue-700 font-medium">Batch of {user.batch}</p>
                        <p className="text-[11px] text-stone-400">{user.course}</p>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 mt-2 line-clamp-2">{user.headline}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        getOrCreateChat(user.uid);
                        setActiveTab('messages');
                      }}
                      className="flex-1 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                    <button
                      onClick={() => setSelectedUserIdForModal(user.uid)}
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REQUESTS (RECEIVED & SENT) */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          {/* Received Requests */}
          <div>
            <h2 className="text-base font-bold text-stone-900 mb-3">
              Received Requests ({receivedRequests.length})
            </h2>

            {receivedRequests.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-stone-200 text-center text-xs text-stone-400">
                No pending requests received at this time.
              </div>
            ) : (
              <div className="space-y-2.5">
                {receivedRequests.map(({ request, user }) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedUserIdForModal(user.uid)}
                    >
                      <img
                        src={user.profilePictureUrl}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 hover:text-blue-600">
                          {user.name}
                        </h4>
                        <p className="text-xs text-stone-500">
                          Batch {user.batch} • {user.course}
                        </p>
                        <p className="text-[11px] text-stone-400">{user.headline}</p>
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
            )}
          </div>

          {/* Sent Requests */}
          <div>
            <h2 className="text-base font-bold text-stone-900 mb-3">
              Sent Requests ({sentRequests.length})
            </h2>

            {sentRequests.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-stone-200 text-center text-xs text-stone-400">
                You have no pending requests sent to other alumni.
              </div>
            ) : (
              <div className="space-y-2.5">
                {sentRequests.map(({ request, user }) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedUserIdForModal(user.uid)}
                    >
                      <img
                        src={user.profilePictureUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-stone-200"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 hover:text-blue-600">
                          {user.name}
                        </h4>
                        <p className="text-xs text-stone-500">
                          Batch {user.batch} • {user.course}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => cancelFriendRequest(request.id)}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-medium transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RECOMMENDED FRIENDS / PEOPLE YOU MAY KNOW */}
      {activeSubTab === 'recommended' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900">Recommended Friends / People You May Know ({recommendedUsers.length})</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Alumni from your graduation batch, degree program, and local alumni chapters
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('directory')}
              className="text-xs font-semibold text-[#8B181B] hover:underline self-start sm:self-auto"
            >
              View All Directory →
            </button>
          </div>

          {recommendedUsers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-stone-200">
              <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">No new recommendations available</p>
              <p className="text-xs text-stone-400 mt-1">
                You can browse the full directory above to find batchmates, mentors, and faculty.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedUsers.map((user) => {
                const reqState = hasPendingRequestWith(user.uid);
                const isSameBatch = user.batch && currentUser?.batch && user.batch === currentUser.batch;
                const isSameCourse = user.course && currentUser?.course && user.course.toLowerCase() === currentUser.course.toLowerCase();

                return (
                  <div
                    key={user.uid}
                    className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <img
                          src={user.profilePictureUrl}
                          alt={user.name}
                          onClick={() => setSelectedUserIdForModal(user.uid)}
                          className="w-13 h-13 rounded-full object-cover border border-stone-200 cursor-pointer hover:opacity-90 shrink-0"
                        />
                        <div className="flex flex-col items-end gap-1">
                          {isSameBatch && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              Batchmate ('{user.batch?.slice(-2) || '24'})
                            </span>
                          )}
                          {isSameCourse && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Same Degree
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4
                          onClick={() => setSelectedUserIdForModal(user.uid)}
                          className="text-sm font-bold text-stone-900 hover:text-blue-600 cursor-pointer"
                        >
                          {user.name}
                        </h4>
                        <p className="text-xs text-stone-600 mt-0.5 font-medium">{user.course || 'Alumnus'}</p>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                          {user.headline || user.currentPosition || 'St. Cecilia’s College Alumnus'}
                        </p>
                        {user.location && (
                          <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{user.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserIdForModal(user.uid)}
                        className="flex-1 py-1.5 px-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg text-center transition-colors"
                      >
                        Profile
                      </button>

                      {reqState === 'sent' ? (
                        <span className="flex-1 py-1.5 px-2 text-xs font-semibold text-stone-500 bg-stone-50 border border-stone-200 rounded-lg text-center">
                          Pending
                        </span>
                      ) : reqState === 'received' ? (
                        <button
                          onClick={() => setActiveSubTab('requests')}
                          className="flex-1 py-1.5 px-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-center shadow-2xs"
                        >
                          Respond
                        </button>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(user.uid)}
                          className="flex-1 py-1.5 px-2 text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] rounded-lg text-center shadow-2xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
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
  );
};

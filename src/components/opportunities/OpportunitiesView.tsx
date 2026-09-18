import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Mail,
  Filter,
  Sparkles,
  Users,
  Clock,
  ShieldCheck,
  Share2,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  FileCheck,
  Send,
  Check,
  Tag,
  X
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { Opportunity } from '../../types';
import { JobApplicationModal } from './JobApplicationModal';
import { JobApplicantsTrackerModal } from './JobApplicantsTrackerModal';
import { JobModerationQueue } from './JobModerationQueue';
import { ShareModal, ShareItem } from '../common/ShareModal';

export const OpportunitiesView: React.FC = () => {
  const {
    currentUser,
    opportunities,
    createOpportunity,
    setSelectedUserIdForModal,
    permissions,
    jobApplications
  } = useAlumni();

  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'explore' | 'my_applications' | 'employer_portal' | 'admin_moderation'>('explore');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [matchOnly, setMatchOnly] = useState(false);
  const [filterByMySkills, setFilterByMySkills] = useState(false);
  const [selectedSkillTag, setSelectedSkillTag] = useState<string>('all');

  // Verified skills from current user profile
  const userVerifiedSkills = useMemo(() => {
    return (currentUser?.skills || []).filter((s) => Boolean(s && s.trim()));
  }, [currentUser?.skills]);

  // Unique list of all skills across published opportunities
  const availableJobSkills = useMemo(() => {
    const skillSet = new Set<string>();
    opportunities.forEach((opp) => {
      if (!opp.approvalStatus || opp.approvalStatus === 'approved') {
        (opp.skills || []).forEach((s) => {
          if (s && s.trim()) skillSet.add(s.trim());
        });
      }
    });
    return Array.from(skillSet).sort((a, b) => a.localeCompare(b));
  }, [opportunities]);

  // Job count for each user verified skill
  const userSkillMatchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    userVerifiedSkills.forEach((skill) => {
      const lower = skill.toLowerCase();
      counts[skill] = opportunities.filter((o) => {
        if (o.approvalStatus && o.approvalStatus !== 'approved') return false;
        return (o.skills || []).some((s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase()));
      }).length;
    });
    return counts;
  }, [opportunities, userVerifiedSkills]);

  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedOpportunityForModal, setSelectedOpportunityForModal] = useState<Opportunity | null>(null);
  const [applyingOpportunity, setApplyingOpportunity] = useState<Opportunity | null>(null);
  const [trackingOpportunity, setTrackingOpportunity] = useState<Opportunity | null>(null);
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);

  // Post Job Form State
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(currentUser?.role === 'employer' && currentUser?.companyName ? currentUser.companyName : '');
  const [location, setLocation] = useState('Cebu City, Philippines');
  const [type, setType] = useState<Opportunity['type']>('Full-time');
  const [salaryOrStipend, setSalaryOrStipend] = useState('₱25,000 – ₱35,000 / month');
  const [requiredCourse, setRequiredCourse] = useState('BS Information Technology');
  const [skillsInput, setSkillsInput] = useState('PHP, Laravel, MySQL, JavaScript');
  const [experienceLevel, setExperienceLevel] = useState('0–2 years');
  const [applicationDeadline, setApplicationDeadline] = useState('2026-10-31');
  const [howToApply, setHowToApply] = useState<'internal' | 'external' | 'both'>('both');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || 'careers@company.com');
  const [description, setDescription] = useState('');

  // Pending count for badge
  const pendingCount = useMemo(() => {
    return opportunities.filter((o) => o.approvalStatus === 'pending_approval').length;
  }, [opportunities]);

  // My Applications count
  const myApplications = useMemo(() => {
    if (!currentUser) return [];
    return jobApplications.filter((a) => a.applicantUid === currentUser.uid);
  }, [jobApplications, currentUser]);

  // My Job Postings (for employers/posters)
  const myPostings = useMemo(() => {
    if (!currentUser) return [];
    return opportunities.filter((o) => o.postedBy === currentUser.uid);
  }, [opportunities, currentUser]);

  // Helper to compute match score between logged-in user & an opportunity
  const computeUserMatch = (opp: Opportunity) => {
    if (!currentUser) return null;
    const reqCourse = (opp.requiredCourse || '').toLowerCase();
    const userCourse = (currentUser.course || '').toLowerCase();
    const courseMatched = reqCourse ? userCourse.includes(reqCourse) || reqCourse.includes(userCourse) || reqCourse.includes('all') : true;

    const oppSkills = opp.skills || [];
    const userSkills = currentUser.skills || [];
    const matchedSkills = oppSkills.filter((s) =>
      userSkills.some((us) => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
    );

    let score = 50;
    if (courseMatched) score += 25;
    if (oppSkills.length > 0) {
      score += Math.round((matchedSkills.length / oppSkills.length) * 20);
    } else {
      score += 20;
    }
    if (opp.location.toLowerCase().includes('cebu') || opp.location.toLowerCase().includes('remote')) {
      score += 5;
    }
    const finalScore = Math.min(Math.max(score, 45), 98);

    return {
      score: finalScore,
      courseMatched,
      matchedSkillsCount: matchedSkills.length,
      totalSkills: oppSkills.length,
      isHighMatch: finalScore >= 80
    };
  };

  // Filtered approved opportunities for public Explore tab
  const publishedOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Must be approved to appear in explore
      if (opp.approvalStatus && opp.approvalStatus !== 'approved') return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        opp.title.toLowerCase().includes(q) ||
        opp.company.toLowerCase().includes(q) ||
        opp.location.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q) ||
        (opp.requiredCourse || '').toLowerCase().includes(q) ||
        (opp.skills || []).some((s) => s.toLowerCase().includes(q));

      const matchesType = selectedType === 'all' || opp.type === selectedType;
      const matchesCourse =
        selectedCourseFilter === 'all' ||
        (opp.requiredCourse || '').toLowerCase().includes(selectedCourseFilter.toLowerCase());

      // Skills-based filter: match at least one verified profile skill
      if (filterByMySkills) {
        if (userVerifiedSkills.length > 0) {
          const oppSkills = opp.skills || [];
          const hasMatchingSkill = oppSkills.some((os) =>
            userVerifiedSkills.some(
              (us) => us.toLowerCase().includes(os.toLowerCase()) || os.toLowerCase().includes(us.toLowerCase())
            )
          );
          if (!hasMatchingSkill) return false;
        }
      }

      // Filter by specific selected skill tag
      if (selectedSkillTag !== 'all') {
        const target = selectedSkillTag.toLowerCase();
        const oppSkills = opp.skills || [];
        const matchesTag = oppSkills.some(
          (s) => s.toLowerCase().includes(target) || target.includes(s.toLowerCase())
        );
        if (!matchesTag) return false;
      }

      if (matchOnly) {
        const match = computeUserMatch(opp);
        if (!match || match.score < 75) return false;
      }

      return matchesSearch && matchesType && matchesCourse;
    });
  }, [
    opportunities,
    searchQuery,
    selectedType,
    selectedCourseFilter,
    matchOnly,
    filterByMySkills,
    selectedSkillTag,
    userVerifiedSkills,
    currentUser
  ]);

  const handleOpenPostModal = () => {
    if (currentUser?.role === 'employer' && currentUser?.companyName) {
      setCompany(currentUser.companyName);
    }
    setShowPostModal(true);
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company || !description) return;

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    createOpportunity({
      title,
      company,
      location: location || 'Cebu City, Philippines',
      type,
      description,
      salaryOrStipend: salaryOrStipend || undefined,
      requiredCourse,
      skills: skills.length > 0 ? skills : ['PHP', 'Laravel', 'MySQL'],
      experienceLevel,
      applicationDeadline,
      howToApply,
      contactEmail: contactEmail || currentUser?.email || 'careers@company.com'
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setShowPostModal(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Hero / Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-[#991B1B]" />
                <span>Cecilian Career Portal & Job Board</span>
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                {publishedOpportunities.length} Active Jobs
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
              Curated employment opportunities, internships, and mentorship listings for graduates of St. Cecilia's College, backed by employer accreditation and alumni admin verification.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {permissions.canPostJobs && (
              <button
                type="button"
                onClick={handleOpenPostModal}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-bold shadow-xs transition-colors w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Post Opportunity</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-stone-100 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('explore')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeSubTab === 'explore'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Explore Jobs ({publishedOpportunities.length})</span>
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={() => setActiveSubTab('my_applications')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeSubTab === 'my_applications'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>My Applications</span>
              {myApplications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-extrabold">
                  {myApplications.length}
                </span>
              )}
            </button>
          )}

          {(currentUser?.role === 'employer' || myPostings.length > 0) && (
            <button
              type="button"
              onClick={() => setActiveSubTab('employer_portal')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeSubTab === 'employer_portal'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Employer ATS Pipeline</span>
              {myPostings.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200 text-stone-800 font-extrabold">
                  {myPostings.length}
                </span>
              )}
            </button>
          )}

          {permissions.canManageJobModeration && (
            <button
              type="button"
              onClick={() => setActiveSubTab('admin_moderation')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeSubTab === 'admin_moderation'
                  ? 'bg-[#991B1B] text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Approval Desk</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-extrabold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* VIEW: EXPLORE JOBS */}
      {activeSubTab === 'explore' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, company name, required course, or skill (e.g. PHP, Laravel, Flutter)..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium"
              >
                <option value="all">All Job Types</option>
                <option value="Full-time">Full-Time</option>
                <option value="Part-time">Part-Time</option>
                <option value="Internship">Internship</option>
                <option value="Mentorship">Mentorship</option>
                <option value="Contract">Contract</option>
              </select>

              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium"
              >
                <option value="all">All Degrees / Courses</option>
                <option value="Information Technology">BS Information Technology</option>
                <option value="Computer Science">BS Computer Science</option>
                <option value="Business">BS Business Administration</option>
                <option value="Education">BSEd / Elementary Education</option>
              </select>

              {/* Skills-Based Dropdown Filter */}
              <select
                value={selectedSkillTag}
                onChange={(e) => setSelectedSkillTag(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium max-w-[180px]"
                title="Filter opportunities by specific required or verified skill"
              >
                <option value="all">All Skills ({availableJobSkills.length})</option>
                {userVerifiedSkills.length > 0 && (
                  <optgroup label="My Profile Skills (Verified)">
                    {userVerifiedSkills.map((skill) => (
                      <option key={`user-skill-${skill}`} value={skill}>
                        ✓ {skill} ({userSkillMatchCounts[skill] || 0} jobs)
                      </option>
                    ))}
                  </optgroup>
                )}
                {availableJobSkills.length > 0 && (
                  <optgroup label="All Industry Skills">
                    {availableJobSkills.map((skill) => (
                      <option key={`job-skill-${skill}`} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* One-Click Verified Skills Filter Toggle */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setFilterByMySkills(!filterByMySkills)}
                  className={`px-3 py-2 text-xs rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    filterByMySkills
                      ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-300'
                      : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                  title={
                    userVerifiedSkills.length > 0
                      ? `Filter postings matching your verified skills (${userVerifiedSkills.join(', ')})`
                      : 'Filter by your verified profile skills'
                  }
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${filterByMySkills ? 'text-white' : 'text-blue-600'}`} />
                  <span>My Verified Skills</span>
                  {userVerifiedSkills.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      filterByMySkills ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userVerifiedSkills.length}
                    </span>
                  )}
                </button>
              )}

              {currentUser && (
                <button
                  type="button"
                  onClick={() => setMatchOnly(!matchOnly)}
                  className={`px-3 py-2 text-xs rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    matchOnly
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Matched For Me</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Skills Filter Banner */}
          {(filterByMySkills || selectedSkillTag !== 'all') && (
            <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Skills-Based Filter Active</span>
                  <span className="text-[11px] font-normal text-blue-700">
                    — Showing {publishedOpportunities.length} job{publishedOpportunities.length === 1 ? '' : 's'} matching {selectedSkillTag !== 'all' ? `"${selectedSkillTag}"` : 'your verified profile skills'}
                  </span>
                </div>

                {userVerifiedSkills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-800/80">
                      Filter by specific skill:
                    </span>
                    {userVerifiedSkills.map((skill) => {
                      const isSelected = selectedSkillTag.toLowerCase() === skill.toLowerCase();
                      return (
                        <button
                          key={`chip-${skill}`}
                          type="button"
                          onClick={() => setSelectedSkillTag(isSelected ? 'all' : skill)}
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-700 text-white shadow-2xs'
                              : 'bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/70'
                          }`}
                        >
                          <span>{skill}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-blue-500'}`}>
                            ({userSkillMatchCounts[skill] || 0})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setFilterByMySkills(false);
                    setSelectedSkillTag('all');
                  }}
                  className="px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-100/70 text-blue-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Skills Filter</span>
                </button>
              </div>
            </div>
          )}

          {/* Job Postings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedOpportunities.map((opp) => {
              const match = computeUserMatch(opp);
              const hasApplied = myApplications.some((a) => a.jobId === opp.id);

              return (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all group"
                >
                  <div>
                    {/* Top badging */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {opp.type}
                        </span>
                        {opp.requiredCourse && (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                            {opp.requiredCourse}
                          </span>
                        )}
                        {hasApplied && (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                            ✓ Applied
                          </span>
                        )}
                      </div>

                      {match && (
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${
                            match.score >= 80
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                          title={`Automated Profile Compatibility Score: ${match.score}%`}
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>{match.score}% Match</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-stone-900 mt-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {opp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 font-medium mt-1.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        {opp.company}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {opp.location}
                      </span>
                    </div>

                    {opp.salaryOrStipend && (
                      <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg inline-block">
                        {opp.salaryOrStipend}
                      </div>
                    )}

                    <p className="text-xs text-stone-600 mt-3 line-clamp-3 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Required Skills Chips with Interactive Filter & Verification Indicators */}
                    {opp.skills && opp.skills.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {match && match.matchedSkillsCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>
                              {match.matchedSkillsCount} of {opp.skills.length} verified skill{match.matchedSkillsCount === 1 ? '' : 's'} match your profile
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {opp.skills.map((s, idx) => {
                            const isSkillMatched = userVerifiedSkills.some(
                              (us) => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase())
                            );
                            const isCurrentlySelected = selectedSkillTag.toLowerCase() === s.toLowerCase();
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedSkillTag(isCurrentlySelected ? 'all' : s)}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all cursor-pointer flex items-center gap-1 ${
                                  isCurrentlySelected
                                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                    : isSkillMatched
                                    ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                }`}
                                title={`Click to filter jobs requiring ${s}`}
                              >
                                <span>{s}</span>
                                {isSkillMatched && <Check className="w-2.5 h-2.5 text-emerald-700 inline" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-[11px] text-stone-400">
                      {opp.applicationsCount ? `${opp.applicationsCount} applicants` : 'Be an early applicant'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setShareItem({
                            title: `${opp.title} at ${opp.company}`,
                            text: `Explore career opportunity: ${opp.title} at ${opp.company} (${opp.location}) - Salary: ${opp.salaryOrStipend || 'Competitive'}. Open to St. Cecilia's College graduates!`,
                            type: 'job'
                          })
                        }
                        className="p-2 text-stone-400 hover:text-blue-600 hover:bg-stone-100 rounded-xl transition-colors"
                        title="Share Job Opportunity"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedOpportunityForModal(opp)}
                        className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Details
                      </button>

                      <button
                        type="button"
                        onClick={() => setApplyingOpportunity(opp)}
                        className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <span>{hasApplied ? 'View / Reapply' : 'Apply Now'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {publishedOpportunities.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
              <Briefcase className="w-10 h-10 text-stone-300 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-stone-800">No Job Postings Matched Your Filters</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  {filterByMySkills || selectedSkillTag !== 'all'
                    ? `No job openings currently require ${selectedSkillTag !== 'all' ? `"${selectedSkillTag}"` : 'your verified profile skills'}. You can clear skills filtering or reset all criteria to view all active openings.`
                    : 'Try expanding your search query or reset employment type and degree filters to browse all open Cecilian roles.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                {(filterByMySkills || selectedSkillTag !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterByMySkills(false);
                      setSelectedSkillTag('all');
                    }}
                    className="px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Skills Filter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedCourseFilter('all');
                    setMatchOnly(false);
                    setFilterByMySkills(false);
                    setSelectedSkillTag('all');
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: MY APPLICATIONS */}
      {activeSubTab === 'my_applications' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <h3 className="text-base font-bold text-stone-900">
              My Job Applications & Status Pipeline ({myApplications.length})
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Track candidate status, feedback notes, and automated match scores for opportunities you applied to.
            </p>
          </div>

          {myApplications.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-2xs">
              <FileCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-800">No Applications Submitted Yet</h4>
              <p className="text-xs text-stone-500 mt-1">
                Explore the job board to find open roles matching your course and submit your application with instant match feedback.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('explore')}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
              >
                Browse Open Roles
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">{app.jobTitle}</span>
                      {app.matchScore && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {app.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 font-medium">
                      {app.companyName} • Applied on {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                    {app.statusNotes && (
                      <p className="text-xs text-blue-700 bg-blue-50/70 p-2 rounded-lg mt-2 border border-blue-100">
                        <strong>Feedback / Note:</strong> {app.statusNotes}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                          app.status === 'Hired'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : app.status === 'Interview'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : app.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {app.status}
                      </span>
                      <div className="text-[10px] text-stone-400 mt-1">Current Candidate Stage</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: EMPLOYER PORTAL / MY JOB POSTINGS */}
      {activeSubTab === 'employer_portal' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Employer Hiring Portal & ATS Tracker ({myPostings.length} Postings)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Review applicant pipelines, download candidate resumes, and evaluate Cecilian graduates.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenPostModal}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Posting</span>
            </button>
          </div>

          <div className="space-y-3">
            {myPostings.map((job) => {
              const applicantsForThis = jobApplications.filter((a) => a.jobId === job.id);
              const isApproved = job.approvalStatus === 'approved';

              return (
                <div
                  key={job.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : job.approvalStatus === 'pending_approval'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {job.approvalStatus ? job.approvalStatus.replace('_', ' ') : 'Live'}
                      </span>
                      <span className="text-xs font-bold text-stone-900">{job.title}</span>
                    </div>

                    <p className="text-xs text-stone-600">
                      {job.company} • {job.location} • {job.type} • {job.salaryOrStipend || 'Competitive'}
                    </p>

                    {job.rejectionReason && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg mt-1 border border-rose-100">
                        Admin Feedback: {job.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTrackingOpportunity(job)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Review Applicants ({applicantsForThis.length})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: ADMIN APPROVAL QUEUE */}
      {activeSubTab === 'admin_moderation' && <JobModerationQueue />}

      {/* OPPORTUNITY DETAIL MODAL */}
      {selectedOpportunityForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-xl p-6 my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedOpportunityForModal.type}
                </span>
                <h2 className="text-lg font-bold text-stone-900 mt-1">
                  {selectedOpportunityForModal.title}
                </h2>
                <p className="text-xs text-stone-600 font-medium">
                  {selectedOpportunityForModal.company} • {selectedOpportunityForModal.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpportunityForModal(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-stone-700 leading-relaxed max-h-80 overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-stone-900 mb-1">Target Academic Degree</h4>
                <p className="text-blue-700 font-medium">
                  {selectedOpportunityForModal.requiredCourse || 'Open to all programs'}
                </p>
              </div>

              {selectedOpportunityForModal.salaryOrStipend && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-1">Salary & Compensation</h4>
                  <p className="text-emerald-700 font-bold">
                    {selectedOpportunityForModal.salaryOrStipend}
                  </p>
                </div>
              )}

              {selectedOpportunityForModal.experienceLevel && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-1">Experience Level</h4>
                  <p className="text-stone-600 font-medium">
                    {selectedOpportunityForModal.experienceLevel}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-stone-900 mb-1">Role Description & Qualifications</h4>
                <p className="whitespace-pre-line leading-relaxed">{selectedOpportunityForModal.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 mb-1">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedOpportunityForModal.skills || []).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-stone-100 text-stone-700 text-xs font-medium rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShareItem({
                    title: `${selectedOpportunityForModal.title} at ${selectedOpportunityForModal.company}`,
                    text: `Check out this career opportunity for Cecilian graduates: ${selectedOpportunityForModal.title} at ${selectedOpportunityForModal.company}.`,
                    type: 'job'
                  });
                }}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Job</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const opp = selectedOpportunityForModal;
                  setSelectedOpportunityForModal(null);
                  setApplyingOpportunity(opp);
                }}
                className="px-5 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Submit Direct Portal Application</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST OPPORTUNITY MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-stone-200">
                  Career Opportunity Publisher
                </span>
                <h3 className="text-base font-bold text-white mt-1">Post a Career Opportunity</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Approval Notice Banner */}
            <div className="bg-amber-50 border-b border-amber-100 p-3 px-5 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {permissions.canManageJobModeration
                  ? 'Admin mode active: Job posting will be published immediately upon submission.'
                  : 'Workflow notice: Postings undergo Alumni Office Admin Verification before publishing live.'}
              </span>
            </div>

            <form onSubmit={handlePost} className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Junior Web Developer"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. ABC Technologies"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Job Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Mentorship">Mentorship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Cebu City"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Salary Range / Compensation</label>
                  <input
                    type="text"
                    value={salaryOrStipend}
                    onChange={(e) => setSalaryOrStipend(e.target.value)}
                    placeholder="e.g. ₱25,000–₱35,000"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Required Academic Course *</label>
                  <input
                    type="text"
                    required
                    value={requiredCourse}
                    onChange={(e) => setRequiredCourse(e.target.value)}
                    placeholder="e.g. BS Information Technology"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Experience Level</label>
                  <input
                    type="text"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    placeholder="e.g. 0–2 years / Fresh Graduate"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Required Skills (comma separated) *</label>
                <input
                  type="text"
                  required
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. PHP, Laravel, MySQL, JavaScript"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">How to Apply</label>
                  <select
                    value={howToApply}
                    onChange={(e) => setHowToApply(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
                  >
                    <option value="both">Direct Portal & Email / Web</option>
                    <option value="internal">Direct Portal Application Only</option>
                    <option value="external">External Email / Website Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Recruitment Contact Email *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="careers@company.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Detailed Description & Qualifications *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide responsibilities, required coursework background, team culture, and how graduates can excel in this role..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl font-bold shadow-xs"
                >
                  Submit For Admin Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOB APPLICATION MODAL */}
      {applyingOpportunity && (
        <JobApplicationModal
          opportunity={applyingOpportunity}
          isOpen={!!applyingOpportunity}
          onClose={() => setApplyingOpportunity(null)}
        />
      )}

      {/* APPLICANT TRACKER MODAL */}
      {trackingOpportunity && (
        <JobApplicantsTrackerModal
          opportunity={trackingOpportunity}
          isOpen={!!trackingOpportunity}
          onClose={() => setTrackingOpportunity(null)}
        />
      )}

      {/* CROSS-APP SHARE MODAL */}
      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        item={shareItem || { title: '' }}
      />
    </div>
  );
};

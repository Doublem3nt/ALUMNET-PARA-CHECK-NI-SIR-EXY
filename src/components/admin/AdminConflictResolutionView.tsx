import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Clock,
  User,
  Mail,
  GraduationCap,
  Calendar,
  FileText,
  FileDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { RegistrationConflictRecord } from '../../types';
import {
  getRegistrationConflicts,
  resolveConflictRecord,
  getRegistrarRecords,
  evaluateIncomingRegistration
} from '../../services/studentVerificationService';
import { generateConflictResolutionPdfReport } from '../../services/conflictReportPdfService';
import { useAlumni } from '../../context/AlumniContext';

export const AdminConflictResolutionView: React.FC = () => {
  const { currentUser, users, setUserVerified, showToast, addAuditLog, setSelectedUserIdForModal } = useAlumni();

  const [conflicts, setConflicts] = useState<RegistrationConflictRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedConflict, setSelectedConflict] = useState<RegistrationConflictRecord | null>(null);

  // Multi-select & Bulk Action states
  const [selectedConflictIds, setSelectedConflictIds] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Resolution note state
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Simulator / Diagnostic Tool state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simStudentId, setSimStudentId] = useState('SC-2020-0192');
  const [simName, setSimName] = useState('Juan C. Reyes');
  const [simEmail, setSimEmail] = useState('test.applicant@gmail.com');
  const [simBatch, setSimBatch] = useState('2024');
  const [simCourse, setSimCourse] = useState('B.S. Information Technology');
  const [simResult, setSimResult] = useState<any | null>(null);

  const loadConflicts = () => {
    const list = getRegistrationConflicts();
    setConflicts(list);
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  // Filtered conflict records
  const filteredConflicts = useMemo(() => {
    return conflicts.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.applicantName.toLowerCase().includes(q) ||
        c.applicantEmail.toLowerCase().includes(q) ||
        (c.applicantStudentId && c.applicantStudentId.toLowerCase().includes(q)) ||
        (c.registryRecord?.fullName && c.registryRecord.fullName.toLowerCase().includes(q));

      const matchesType = typeFilter === 'all' || c.conflictType === typeFilter;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [conflicts, searchQuery, typeFilter, statusFilter]);

  // Summary counts
  const pendingCount = conflicts.filter((c) => c.status === 'pending').length;
  const verifiedCount = conflicts.filter((c) => c.status === 'resolved_verified').length;
  const rejectedCount = conflicts.filter((c) => c.status === 'resolved_rejected').length;

  // Handle resolution action
  const handleResolve = (
    conflict: RegistrationConflictRecord,
    action: 'resolved_verified' | 'resolved_rejected' | 'dismissed'
  ) => {
    const actorName = currentUser?.name || 'Registrar Officer';
    const success = resolveConflictRecord(
      conflict.id,
      action,
      actorName,
      resolutionNote || undefined
    );

    if (success) {
      // If user profile exists in state, update verification status
      if (conflict.applicantUid) {
        if (action === 'resolved_verified') {
          setUserVerified(conflict.applicantUid, true);
        } else if (action === 'resolved_rejected') {
          setUserVerified(conflict.applicantUid, false);
        }
      } else {
        // Find user by email or student ID if uid wasn't attached
        const matchedUser = users.find(
          (u) =>
            u.email.toLowerCase() === conflict.applicantEmail.toLowerCase() ||
            (conflict.applicantStudentId && u.studentId === conflict.applicantStudentId)
        );
        if (matchedUser) {
          setUserVerified(matchedUser.uid, action === 'resolved_verified');
        }
      }

      addAuditLog({
        action: `CONFLICT_RESOLUTION_${action.toUpperCase()}`,
        actorId: currentUser?.uid || 'registrar',
        actorName,
        actorRole: currentUser?.role || 'registrar',
        category: 'security',
        details: `${action === 'resolved_verified' ? 'Approved and auto-verified' : 'Rejected/Dismissed'} registration conflict for ${conflict.applicantName} (Student ID: ${conflict.applicantStudentId || 'N/A'}). Note: ${resolutionNote || 'Routine registrar inspection'}.`,
        severity: action === 'resolved_verified' ? 'success' : 'warning'
      });

      showToast(
        action === 'resolved_verified'
          ? `✓ Applicant ${conflict.applicantName} approved and granted verified alumni access.`
          : action === 'resolved_rejected'
          ? `Duplicate registration for ${conflict.applicantName} rejected to protect masterlist integrity.`
          : `Conflict flag dismissed.`,
        action === 'resolved_verified' ? 'success' : 'info'
      );

      loadConflicts();
      setResolvingId(null);
      setResolutionNote('');
      if (selectedConflict?.id === conflict.id) {
        setSelectedConflict(null);
      }
    }
  };

  // Visible pending records for multi-select
  const visiblePendingConflicts = useMemo(() => {
    return filteredConflicts.filter((c) => c.status === 'pending');
  }, [filteredConflicts]);

  const isAllPendingSelected =
    visiblePendingConflicts.length > 0 &&
    visiblePendingConflicts.every((c) => selectedConflictIds.includes(c.id));

  const handleToggleSelect = (id: string) => {
    setSelectedConflictIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPending = () => {
    if (isAllPendingSelected) {
      const pendingIds = new Set(visiblePendingConflicts.map((c) => c.id));
      setSelectedConflictIds((prev) => prev.filter((id) => !pendingIds.has(id)));
    } else {
      const newIds = new Set([...selectedConflictIds, ...visiblePendingConflicts.map((c) => c.id)]);
      setSelectedConflictIds(Array.from(newIds));
    }
  };

  // Perform bulk action (Approve or Reject)
  const handleBulkResolve = (action: 'resolved_verified' | 'resolved_rejected') => {
    if (selectedConflictIds.length === 0) return;
    setIsProcessingBulk(true);

    const actorName = currentUser?.name || 'Registrar Officer';
    let processed = 0;

    selectedConflictIds.forEach((id) => {
      const conflict = conflicts.find((c) => c.id === id);
      if (!conflict) return;

      const note =
        bulkNote.trim() ||
        `Bulk resolution (${action === 'resolved_verified' ? 'Approved' : 'Rejected'}) by ${actorName}`;
      const success = resolveConflictRecord(id, action, actorName, note);

      if (success) {
        processed++;
        if (conflict.applicantUid) {
          setUserVerified(conflict.applicantUid, action === 'resolved_verified');
        } else {
          const matchedUser = users.find(
            (u) =>
              u.email.toLowerCase() === conflict.applicantEmail.toLowerCase() ||
              (conflict.applicantStudentId && u.studentId === conflict.applicantStudentId)
          );
          if (matchedUser) {
            setUserVerified(matchedUser.uid, action === 'resolved_verified');
          }
        }
      }
    });

    addAuditLog({
      action: `BULK_CONFLICT_RESOLUTION_${action.toUpperCase()}`,
      actorId: currentUser?.uid || 'registrar',
      actorName,
      actorRole: currentUser?.role || 'registrar',
      category: 'conflict_resolution',
      details: `Bulk ${action === 'resolved_verified' ? 'approved & verified' : 'rejected & blocked'} ${processed} student registration conflict records. Reason: "${bulkNote.trim() || 'Commencement masterlist batch reconciliation'}"`,
      severity: action === 'resolved_verified' ? 'success' : 'warning'
    });

    showToast(
      `✓ Processed ${processed} records: ${
        action === 'resolved_verified' ? 'Bulk Approved and Verified' : 'Bulk Rejected and Blocked'
      }!`,
      'success'
    );

    setSelectedConflictIds([]);
    setBulkNote('');
    setIsProcessingBulk(false);
    loadConflicts();
  };

  // Generate official PDF report
  const handleGeneratePdfReport = () => {
    try {
      generateConflictResolutionPdfReport(conflicts, {
        officerName: currentUser?.name || 'Registrar Officer',
        officerRole: currentUser?.role === 'admin' ? 'System Administrator' : 'Office of the Registrar',
        institutionName: "St. Cecilia's College - Cebu, Inc."
      });

      addAuditLog({
        action: 'CONFLICT_REPORT_PDF_GENERATED',
        actorId: currentUser?.uid || 'registrar',
        actorName: currentUser?.name || 'Registrar Officer',
        actorRole: currentUser?.role || 'registrar',
        category: 'conflict_resolution',
        details: `Generated and downloaded session Conflict Resolution & Manual Overrides PDF audit report for ${conflicts.length} incidents.`,
        severity: 'info'
      });

      showToast('Downloaded official PDF audit report of session resolutions and manual overrides!', 'success');
    } catch (err: any) {
      showToast(`Failed to generate PDF: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  // Run the backend evaluator simulator
  const handleRunSimulator = () => {
    const res = evaluateIncomingRegistration(
      {
        studentId: simStudentId.trim(),
        name: simName.trim(),
        email: simEmail.trim(),
        batch: simBatch.trim(),
        course: simCourse.trim()
      },
      users
    );
    setSimResult(res);
    loadConflicts(); // Refresh if conflict was created
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'duplicate_id':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'name_mismatch':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'batch_discrepancy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const formatConflictLabel = (type: string) => {
    switch (type) {
      case 'duplicate_id':
        return 'Duplicate Student ID';
      case 'name_mismatch':
        return 'Name Mismatch';
      case 'batch_discrepancy':
        return 'Graduation Batch Discrepancy';
      case 'partial_match':
        return 'Partial Record Match';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-rose-200 text-xs font-semibold mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Registrar Security Guard • Duplicate & Conflict Resolution</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Registration Conflict Resolution Center
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-rose-100/90 leading-relaxed">
            The automated matcher flags registrations that partially match accredited records or attempt to claim an already-registered Student ID. Inspect discrepancies below, review evidence side-by-side, and resolve conflicts manually to prevent duplicate accounts and preserve graduate records integrity.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{showSimulator ? 'Close Diagnostic Simulator' : 'Test Match & Conflict Simulator'}</span>
            </button>
            <button
              onClick={loadConflicts}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-amber-700 font-medium">Cases</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Requiring manual inspection</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved & Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{verifiedCount}</span>
            <span className="text-xs text-emerald-600 font-medium">Cleared</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Manual overrides granted</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked Takeovers</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-700">{rejectedCount}</span>
            <span className="text-xs text-rose-600 font-medium">Rejected</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Duplicate accounts prevented</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Evaluated</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">{conflicts.length}</span>
            <span className="text-xs text-blue-600 font-medium">Total Flags</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Masterlist audit log</p>
        </div>
      </div>

      {/* MATCH & CONFLICT SIMULATOR (Diagnostic Tool) */}
      {showSimulator && (
        <div className="bg-stone-900 text-white rounded-2xl p-6 border border-stone-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Interactive Registration Matcher & Conflict Simulator</h3>
                <p className="text-[11px] text-stone-400">
                  Simulate an incoming applicant registration to verify whether the backend evaluator grants instant auto-verification or flags a conflict.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSimulator(false)}
              className="text-stone-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-stone-300 mb-1 font-semibold">Student ID to test</label>
              <input
                type="text"
                value={simStudentId}
                onChange={(e) => setSimStudentId(e.target.value)}
                placeholder="SC-2020-0192"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 font-semibold">Applicant Full Name</label>
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="Juan C. Reyes"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 font-semibold">Applicant Email</label>
              <input
                type="email"
                value={simEmail}
                onChange={(e) => setSimEmail(e.target.value)}
                placeholder="applicant@gmail.com"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-stone-300 mb-1 font-semibold">Graduation Batch Year</label>
              <input
                type="text"
                value={simBatch}
                onChange={(e) => setSimBatch(e.target.value)}
                placeholder="2024"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 font-semibold">Course / Degree Program</label>
              <input
                type="text"
                value={simCourse}
                onChange={(e) => setSimCourse(e.target.value)}
                placeholder="B.S. Information Technology"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleRunSimulator}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Evaluate Against Masterlist</span>
            </button>
          </div>

          {simResult && (
            <div
              className={`p-4 rounded-xl border text-xs ${
                simResult.isAutoVerified
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : simResult.status === 'CONFLICT_FLAGGED'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                  : 'bg-stone-800 border-stone-700 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {simResult.isAutoVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>DIRECT ACCESS GRANTED: Instant Auto-Verification (Bypasses Manual Step)</span>
                  </>
                ) : simResult.status === 'CONFLICT_FLAGGED' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>CONFLICT FLAGGED: Added to Conflict Resolution Queue (Duplicate Prevention)</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4 text-stone-400" />
                    <span>MANUAL REVIEW REQUIRED: No matching masterlist entry found</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed mt-1">{simResult.message}</p>
              {simResult.matchReasons && simResult.matchReasons.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] list-disc list-inside opacity-90">
                  {simResult.matchReasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student ID, applicant name, email, or registry record..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400 ml-1.5" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-stone-700 py-1 pr-2 focus:outline-hidden"
            >
              <option value="all">All Conflict Types</option>
              <option value="duplicate_id">Duplicate Student ID</option>
              <option value="name_mismatch">Name Mismatch</option>
              <option value="batch_discrepancy">Batch Discrepancy</option>
              <option value="partial_match">Partial Match</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-stone-700 py-1 px-2 focus:outline-hidden font-semibold"
            >
              <option value="pending">Pending Only ({pendingCount})</option>
              <option value="resolved_verified">Approved & Verified ({verifiedCount})</option>
              <option value="resolved_rejected">Rejected Duplicates ({rejectedCount})</option>
              <option value="all">All Statuses ({conflicts.length})</option>
            </select>
          </div>

          <button
            onClick={handleGeneratePdfReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Generate official PDF report summarizing all resolved conflicts and manual overrides"
          >
            <FileDown className="w-4 h-4 text-rose-700" />
            <span>Session Audit PDF</span>
          </button>
        </div>
      </div>

      {/* Multi-Select & Bulk Actions Bar */}
      {visiblePendingConflicts.length > 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAllPending}
              className="flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer select-none"
            >
              {isAllPendingSelected ? (
                <CheckSquare className="w-4 h-4 text-rose-600" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
              <span>
                {isAllPendingSelected ? 'Deselect All Pending' : `Select All Pending (${visiblePendingConflicts.length})`}
              </span>
            </button>
            {selectedConflictIds.length > 0 && (
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                {selectedConflictIds.length} selected for batch action
              </span>
            )}
          </div>

          {selectedConflictIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 md:justify-end">
              <input
                type="text"
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                placeholder="Batch justification note (optional)..."
                className="text-xs px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500 w-full sm:w-64"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessingBulk}
                  onClick={() => handleBulkResolve('resolved_verified')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Bulk Approve ({selectedConflictIds.length})</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessingBulk}
                  onClick={() => handleBulkResolve('resolved_rejected')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Bulk Reject ({selectedConflictIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedConflictIds([])}
                  className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-700 font-medium transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Conflict Cards List */}
      <div className="space-y-4">
        {filteredConflicts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No Conflict Records Found</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
              {statusFilter === 'pending'
                ? 'All incoming registration attempts either cleanly matched the masterlist or have already been reviewed. The queue is completely clear!'
                : 'No registration entries matched the selected filter criteria.'}
            </p>
          </div>
        ) : (
          filteredConflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                conflict.status === 'pending'
                  ? selectedConflictIds.includes(conflict.id)
                    ? 'border-rose-500 ring-2 ring-rose-500/30'
                    : 'border-amber-300 ring-1 ring-amber-300/40'
                  : 'border-stone-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 bg-stone-50/70 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {conflict.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(conflict.id)}
                      className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      title="Select for bulk action"
                    >
                      {selectedConflictIds.includes(conflict.id) ? (
                        <CheckSquare className="w-5 h-5 text-rose-600" />
                      ) : (
                        <Square className="w-5 h-5 text-stone-400" />
                      )}
                    </button>
                  )}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      conflict.conflictType === 'duplicate_id'
                        ? 'bg-rose-100 text-rose-700'
                        : conflict.conflictType === 'name_mismatch'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-stone-900">
                        {conflict.applicantName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                          conflict.conflictType
                        )}`}
                      >
                        {formatConflictLabel(conflict.conflictType)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          conflict.severity === 'high'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        Severity: {conflict.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{conflict.applicantEmail}</span>
                      <span className="text-stone-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>Flagged {new Date(conflict.flaggedAt).toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {conflict.status === 'pending' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      Action Required
                    </span>
                  ) : conflict.status === 'resolved_verified' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolved: Verified
                    </span>
                  ) : conflict.status === 'resolved_rejected' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Resolved: Rejected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600">
                      Dismissed
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side Comparison Container */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Applicant Claim */}
                  <div className="bg-rose-50/40 rounded-xl p-4 border border-rose-200/70 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                        <User className="w-4 h-4 text-rose-600" />
                        <span>Incoming Registration Claim</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        Submitted Details
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Entered Student ID:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {conflict.applicantStudentId || 'None Specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Applicant Full Name:</span>
                        <span className="font-bold text-stone-900">{conflict.applicantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Registered Email:</span>
                        <span className="text-stone-800">{conflict.applicantEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Claimed Batch Cohort:</span>
                        <span className="font-semibold text-stone-900">
                          Class of {conflict.applicantBatch || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Degree / Major:</span>
                        <span className="text-stone-800 text-right truncate max-w-[200px]">
                          {conflict.applicantCourse || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Masterlist Record */}
                  <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-200/70 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>Official Registrar Masterlist Record</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                        Accredited Archive
                      </span>
                    </div>

                    {conflict.registryRecord ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Masterlist Student ID:</span>
                          <span className="font-mono font-bold text-blue-900">
                            {conflict.registryRecord.studentId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Graduate Name:</span>
                          <span className="font-bold text-stone-900">
                            {conflict.registryRecord.fullName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Institutional Email:</span>
                          <span className="text-stone-800">
                            {conflict.registryRecord.email || 'None on file'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Official Batch Year:</span>
                          <span className="font-semibold text-stone-900">
                            Class of {conflict.registryRecord.batchYear}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Accredited Degree:</span>
                          <span className="text-stone-800 text-right truncate max-w-[200px]">
                            {conflict.registryRecord.course}
                          </span>
                        </div>
                        {conflict.registryRecord.honors && (
                          <div className="flex justify-between text-[11px] pt-1 text-emerald-800 font-semibold">
                            <span>Honors / Awards:</span>
                            <span>{conflict.registryRecord.honors}</span>
                          </div>
                        )}
                        {conflict.registryRecord.isRegistered && (
                          <div className="p-1.5 mt-1 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                            ⚠️ Note: This student ID is already marked as registered to UID{' '}
                            {conflict.registryRecord.matchedUid || 'alumni_account'}.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-stone-500 text-xs py-4 text-center">
                        <p>No corresponding masterlist record found with this exact ID.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason & Diagnostics Box */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900">Conflict Diagnostic Analysis: </span>
                    <span className="text-stone-700">{conflict.notes}</span>
                    {conflict.resolutionNote && (
                      <p className="mt-1.5 text-stone-600 italic">
                        <span className="font-semibold not-italic">Resolution Log: </span>
                        {conflict.resolutionNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons for Pending Conflict */}
                {conflict.status === 'pending' && (
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-stone-100">
                    <div className="flex-1">
                      {resolvingId === conflict.id ? (
                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Add registrar inspection note (e.g., Confirmed name change via transcript)..."
                          className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                          autoFocus
                        />
                      ) : (
                        <p className="text-[11px] text-stone-500">
                          Inspect transcript or identity proof before approving or rejecting to protect alumni accounts.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (resolvingId !== conflict.id) {
                            setResolvingId(conflict.id);
                          } else {
                            handleResolve(conflict, 'resolved_rejected');
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject Duplicate</span>
                      </button>

                      <button
                        onClick={() => {
                          if (resolvingId !== conflict.id) {
                            setResolvingId(conflict.id);
                          } else {
                            handleResolve(conflict, 'dismissed');
                          }
                        }}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Dismiss
                      </button>

                      <button
                        onClick={() => {
                          if (resolvingId !== conflict.id) {
                            setResolvingId(conflict.id);
                          } else {
                            handleResolve(conflict, 'resolved_verified');
                          }
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve & Force Auto-Verify</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

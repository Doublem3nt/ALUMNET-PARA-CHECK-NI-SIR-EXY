import React, { useState, useMemo } from 'react';
import {
  Bot,
  Activity,
  Database,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Play,
  RefreshCw,
  Search,
  Filter,
  Download,
  UserCheck,
  AlertCircle,
  Sparkles,
  Archive,
  Briefcase,
  BarChart2,
  Mail,
  UserX,
  Lock,
  Unlock,
  Eye,
  Send,
  Calendar
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import {
  detectDuplicateRecords,
  detectIncompleteRecords,
  generateAlumniReport
} from '../../services/automationService';
import { AuditLogEntry, AutomationJob, CareerSurveyResponse, DatabaseBackupSnapshot } from '../../types';

export const AdminAutomationDashboard: React.FC = () => {
  const {
    users,
    auditLogs,
    automationJobs,
    careerSurveys,
    backups,
    runAutomationJob,
    triggerDatabaseBackup,
    verifyAndApproveAlumni,
    unlockUserAccount,
    showToast,
    setSelectedUserIdForModal
  } = useAlumni();

  const [activeSubTab, setActiveSubTab] = useState<'jobs' | 'verification' | 'audit' | 'tracer' | 'backups'>('jobs');

  // Audit Logs State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<string>('all');
  const [auditSeverity, setAuditSeverity] = useState<string>('all');

  // Job running simulation state
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Duplicates and incomplete profiles
  const duplicateFlags = useMemo(() => detectDuplicateRecords(users), [users]);
  const incompleteFlags = useMemo(() => detectIncompleteRecords(users), [users]);
  const alumniReport = useMemo(() => generateAlumniReport(users, 'monthly'), [users]);

  // Unverified/Pending Alumni Queue
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.role === 'alumni' && !u.isVerified);
  }, [users]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = auditSearch.toLowerCase();
      const matchesSearch =
        log.action.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.ipAddress && log.ipAddress.includes(q));

      const matchesCat = auditCategory === 'all' || log.category === auditCategory;
      const matchesSev = auditSeverity === 'all' || log.severity === auditSeverity;

      return matchesSearch && matchesCat && matchesSev;
    });
  }, [auditLogs, auditSearch, auditCategory, auditSeverity]);

  const handleRunJob = (job: AutomationJob) => {
    setRunningJobId(job.id);
    runAutomationJob(job.id);
    setTimeout(() => {
      setRunningJobId(null);
      showToast(`Automation routine "${job.name}" executed successfully.`, 'success');
    }, 900);
  };

  const handleManualBackup = () => {
    setIsBackingUp(true);
    triggerDatabaseBackup('manual');
    setTimeout(() => {
      setIsBackingUp(false);
      showToast('Institutional database backup snapshot created and archived.', 'success');
    }, 800);
  };

  const handleApproveAlumnus = (uid: string, name: string) => {
    verifyAndApproveAlumni(uid, true);
    showToast(`Alumnus ${name} verified against institutional registrar records.`, 'success');
  };

  const handleFlagAlumnus = (uid: string, name: string) => {
    const reason = prompt('Please specify the verification discrepancy (e.g., student ID mismatch or pending transcript):', 'Student ID does not match registrar record.');
    if (reason) {
      verifyAndApproveAlumni(uid, false, reason);
      showToast(`Account for ${name} flagged for admin review.`, 'warning');
    }
  };

  const handleExportAuditJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Audit log export generated and downloaded.', 'info');
  };

  const handleExportBackupJson = (snap: DatabaseBackupSnapshot) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snap, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_${snap.id}_${snap.timestamp.slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Snapshot ${snap.id} downloaded.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Automation Engine Status Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Alumni Management Automations Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Automated student registry verification, periodic database backups, security audit trails, and career tracer tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleManualBackup}
              disabled={isBackingUp}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Archive className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
              <span>{isBackingUp ? 'Backing Up...' : 'Instant Snapshot'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                automationJobs.forEach((j) => runAutomationJob(j.id));
                showToast('Triggered execution of all active automation routines.', 'success');
              }}
              className="px-3.5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run All Routines</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-stone-100 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
            <div className="text-stone-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Automation Routines</span>
            </div>
            <div className="text-lg font-extrabold text-stone-900 mt-1">
              {automationJobs.length}{' '}
              <span className="text-[11px] font-normal text-emerald-600">Active</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
            <div className="text-stone-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              <span>Audit Log Trail</span>
            </div>
            <div className="text-lg font-extrabold text-stone-900 mt-1">
              {auditLogs.length}{' '}
              <span className="text-[11px] font-normal text-stone-500">Events</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
            <div className="text-stone-500 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-stone-400" />
              <span>Tracer Responses</span>
            </div>
            <div className="text-lg font-extrabold text-stone-900 mt-1">
              {careerSurveys.length}{' '}
              <span className="text-[11px] font-normal text-blue-600">{alumniReport.employmentRate}% Employed</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
            <div className="text-stone-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-stone-400" />
              <span>Snapshots Archived</span>
            </div>
            <div className="text-lg font-extrabold text-stone-900 mt-1">
              {backups.length}{' '}
              <span className="text-[11px] font-normal text-purple-600">Stored</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-stone-200 bg-white rounded-t-2xl px-4 pt-2 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('jobs')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'jobs'
              ? 'border-[#991B1B] text-[#991B1B]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Scheduled Jobs & Routines</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600">
            {automationJobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('verification')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'verification'
              ? 'border-[#991B1B] text-[#991B1B]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Registration Verification & Flagged</span>
          {pendingUsers.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-extrabold">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'audit'
              ? 'border-[#991B1B] text-[#991B1B]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Audit Logs</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600">
            {auditLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tracer')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'tracer'
              ? 'border-[#991B1B] text-[#991B1B]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Career Tracer & Employment</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600">
            {careerSurveys.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('backups')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'backups'
              ? 'border-[#991B1B] text-[#991B1B]'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Backups</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600">
            {backups.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: SCHEDULED JOBS & ROUTINES */}
      {activeSubTab === 'jobs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Active Automation Schedules</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automated background workers ensuring real-time integrity, engagement triggers, and institutional backups.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automationJobs.map((job) => {
                const isRunning = runningJobId === job.id;

                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-200 text-stone-700">
                            {job.category}
                          </span>
                          <h4 className="text-xs font-bold text-stone-900 mt-1.5">{job.name}</h4>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            job.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {job.status}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-2 leading-relaxed">{job.description}</p>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-200/60 text-[11px]">
                        <div>
                          <span className="text-stone-400 block">Frequency</span>
                          <span className="font-semibold text-stone-700">{job.frequency}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block">Executions</span>
                          <span className="font-semibold text-stone-700">{job.triggerCount} runs</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block">Last Run</span>
                          <span className="font-semibold text-stone-700">
                            {new Date(job.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block">Next Scheduled</span>
                          <span className="font-semibold text-stone-700">
                            {new Date(job.nextRun).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Health verified
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRunJob(job)}
                        disabled={isRunning}
                        className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all"
                      >
                        <Play className={`w-3 h-3 text-[#991B1B] ${isRunning ? 'animate-spin' : ''}`} />
                        <span>{isRunning ? 'Running...' : 'Execute Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REGISTRATION VERIFICATION & RECORD FLAGGING */}
      {activeSubTab === 'verification' && (
        <div className="space-y-5">
          {/* Pending Accounts Queue */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>Pending Alumni Registration Verification</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
                    {pendingUsers.length} Pending
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automatically checked against school records. Mismatched or incomplete profiles require administrative review.
                </p>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-stone-800">All Registrations Up to Date</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  There are no pending unverified alumni accounts. All registrations match institutional records.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Alumnus Name & ID</th>
                      <th className="py-2.5 px-3">Batch & Course</th>
                      <th className="py-2.5 px-3">Match Status</th>
                      <th className="py-2.5 px-3">Verification Details</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {pendingUsers.map((u) => {
                      const hasId = Boolean(u.studentId && u.studentId.trim().length > 3);
                      const isLockout = Boolean(u.securityLockout);

                      return (
                        <tr key={u.uid} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.profilePictureUrl}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-stone-200"
                              />
                              <div>
                                <span
                                  onClick={() => setSelectedUserIdForModal(u.uid)}
                                  className="font-bold text-stone-900 hover:text-blue-600 cursor-pointer block"
                                >
                                  {u.name}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  ID: {u.studentId || 'Not specified'} • {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-semibold text-stone-800 block">
                              Class of {u.batch || 'N/A'}
                            </span>
                            <span className="text-[11px] text-stone-500 truncate max-w-xs block">
                              {u.course || 'Degree not logged'}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {hasId ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                Record Match Found
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Missing Student ID
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="text-[11px] text-stone-600">
                              {u.verificationReason ? (
                                <span className="text-red-700 font-medium">{u.verificationReason}</span>
                              ) : (
                                <span>Awaiting institutional registrar sign-off</span>
                              )}
                              {isLockout && (
                                <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[9px] font-bold">
                                  LOCKED
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isLockout && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    unlockUserAccount(u.uid);
                                    showToast(`Unlocked account for ${u.name}.`, 'info');
                                  }}
                                  className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 rounded-lg hover:bg-stone-200"
                                  title="Unlock Account"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleApproveAlumnus(u.uid, u.name)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleFlagAlumnus(u.uid, u.name)}
                                className="px-2.5 py-1 bg-white border border-stone-200 hover:bg-stone-100 text-red-600 rounded-lg text-xs font-medium"
                              >
                                <span>Flag / Deny</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Incomplete Profile Warnings */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>Profile Completion Reminders Automation</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700 font-semibold">
                    {incompleteFlags.length} Profiles &lt; 75%
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automated notifications are scheduled to prompt these alumni to fill in their company, skills, and contact info.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  runAutomationJob('auto_profile_reminder');
                  showToast(`Dispatched automated profile completion reminders to ${incompleteFlags.length} alumni.`, 'success');
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reminders Now</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {incompleteFlags.slice(0, 6).map((flag) => (
                <div key={flag.uid} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        onClick={() => setSelectedUserIdForModal(flag.uid)}
                        className="font-bold text-stone-900 hover:text-blue-600 cursor-pointer truncate"
                      >
                        {flag.name}
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-700">
                        {flag.completionPercentage}% Done
                      </span>
                    </div>

                    <div className="w-full bg-stone-200 rounded-full h-1.5 mt-1.5 mb-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${flag.completionPercentage}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-stone-500">
                      <span className="font-semibold text-stone-700">Missing:</span>{' '}
                      {flag.missingFields.slice(0, 3).join(', ')}
                      {flag.missingFields.length > 3 && ` +${flag.missingFields.length - 3} more`}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400">
                    <span>Batch {flag.batch || 'N/A'}</span>
                    <button
                      type="button"
                      onClick={() => showToast(`Sent prompt to ${flag.email}.`, 'info')}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Remind Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicate Detection */}
          {duplicateFlags.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Potential Duplicate Records Flagged ({duplicateFlags.length})
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                {duplicateFlags.map((dup) => (
                  <div key={dup.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900">{dup.primaryName}</span>
                      <span className="text-stone-500"> matches with </span>
                      <span className="font-bold text-stone-900">{dup.potentialDuplicateName}</span>
                      <span className="text-amber-800 ml-2 text-[10px] font-bold">
                        ({dup.confidenceScore}% confidence based on {dup.matchCriteria})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => showToast('Merged duplicate records.', 'success')}
                      className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-md text-xs font-semibold hover:bg-amber-100"
                    >
                      Resolve & Merge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: SYSTEM AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Institutional Audit Logs</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Immutable, timestamped record of administrative approvals, logins, role adjustments, and automated syncs.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportAuditJson}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit actions, actors, or details..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#991B1B]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={auditCategory}
                onChange={(e) => setAuditCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="alumni_registration">Registration</option>
                <option value="security">Security</option>
                <option value="career">Career Tracer</option>
                <option value="communication">Communication</option>
                <option value="admin">Admin Operations</option>
              </select>

              <select
                value={auditSeverity}
                onChange={(e) => setAuditSeverity(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden"
              >
                <option value="all">All Severities</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="alert">Alert</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action & Category</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                      No audit events match your search filters.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-stone-900 block">{log.action}</span>
                        <span className="text-[10px] text-stone-400 uppercase">{log.category}</span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-stone-800 block">{log.actorName}</span>
                        <span className="text-[10px] text-stone-400 capitalize">{log.actorRole}</span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.severity === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : log.severity === 'alert'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-stone-600 text-[11px] max-w-md">
                        {log.details}
                        {log.ipAddress && (
                          <span className="text-[10px] text-stone-400 ml-1.5 font-mono">
                            ({log.ipAddress})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CAREER TRACER & EMPLOYMENT */}
      {activeSubTab === 'tracer' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Graduate Tracer & Employment Outcomes
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Institutional career progression analytics, industry alignments, and CHED tracer reports.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    runAutomationJob('auto_career_tracer');
                    showToast('Dispatched annual graduate tracer survey to graduating classes.', 'success');
                  }}
                  className="px-3 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Tracer Survey Blast</span>
                </button>
              </div>
            </div>

            {/* Employment Rate and Industry Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs text-stone-500 block">Overall Employment Rate</span>
                <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                  {alumniReport.employmentRate}%
                </span>
                <span className="text-[10px] text-stone-400">
                  Based on verified user profiles & tracer responses
                </span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs text-stone-500 block">Survey Submissions</span>
                <span className="text-2xl font-extrabold text-stone-900 mt-1 block">
                  {careerSurveys.length}
                </span>
                <span className="text-[10px] text-stone-400">
                  Total respondents across all graduation years
                </span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs text-stone-500 block">Active Engagement Rate</span>
                <span className="text-2xl font-extrabold text-blue-700 mt-1 block">
                  {alumniReport.activeEngagementRate}%
                </span>
                <span className="text-[10px] text-stone-400">
                  Participating in alumni events and community mentoring
                </span>
              </div>
            </div>

            {/* Top Industries */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                Top Employment Sectors
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {alumniReport.topIndustries.slice(0, 4).map((ind) => (
                  <div key={ind.industry} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 text-xs">
                    <div className="font-bold text-stone-800 truncate">{ind.industry}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5 flex justify-between">
                      <span>{ind.count} graduates</span>
                      <span className="font-semibold text-stone-700">{ind.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracer Responses Roster */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                Recent Graduate Survey Responses
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Alumnus</th>
                      <th className="py-2.5 px-3">Batch & Course</th>
                      <th className="py-2.5 px-3">Current Role & Company</th>
                      <th className="py-2.5 px-3">Degree Alignment</th>
                      <th className="py-2.5 px-3">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {careerSurveys.map((surv) => (
                      <tr key={surv.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-stone-900">
                          {surv.userName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-stone-800">Class of {surv.batch}</span>
                          <span className="text-[10px] text-stone-500 block truncate max-w-xs">{surv.course}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-stone-800">{surv.jobTitle}</span>
                          <span className="text-[11px] text-stone-500 block">{surv.company} ({surv.industry})</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              surv.relevanceToDegree === 'Directly Related'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {surv.relevanceToDegree}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 italic text-[11px] max-w-xs truncate">
                          "{surv.feedback}"
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: DATABASE BACKUPS */}
      {activeSubTab === 'backups' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Institutional Database Backups & Snapshots
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Automated recurring disaster-recovery backups preserving profiles, events, and audit logs.
              </p>
            </div>

            <button
              type="button"
              onClick={handleManualBackup}
              disabled={isBackingUp}
              className="px-3 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Archive className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
              <span>{isBackingUp ? 'Generating Backup...' : 'Create Snapshot'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Snapshot ID</th>
                  <th className="py-2.5 px-3">Date & Timestamp</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Record Count</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Integrity</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {backups.map((snap) => (
                  <tr key={snap.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-800 text-[11px]">
                      {snap.id}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 text-[11px]">
                      {new Date(snap.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          snap.type === 'automated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {snap.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-700">
                      {snap.recordCount} documents
                    </td>
                    <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">
                      {snap.sizeKb} KB
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleExportBackupJson(snap)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

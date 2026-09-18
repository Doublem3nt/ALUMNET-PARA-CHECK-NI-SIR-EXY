import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GraduationCap,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  UserCheck,
  FileText,
  Copy,
  Check,
  Plus,
  ArrowRight,
  HelpCircle,
  FileDown,
  TrendingUp,
  Layers,
  CheckSquare
} from 'lucide-react';
import { StudentVerificationRecord } from '../../types';
import {
  getRegistrarRecords,
  saveRegistrarRecords,
  addRegistrarRecords,
  deleteRegistrarRecord,
  parseRegistrarFile,
  downloadSampleCsvTemplate,
  downloadSampleExcelTemplate,
  findRegistryMatch,
  resetRegistrarRecords,
  exportRegistryRecordsToCsv,
  syncRegistrarRecordsWithFirestore,
  DEFAULT_REGISTRAR_RECORDS
} from '../../services/studentVerificationService';
import { useAlumni } from '../../context/AlumniContext';
import { CsvStudentBulkImporter } from './CsvStudentBulkImporter';

export const RegistrarRegistryMatcher: React.FC = () => {
  const { users, currentUser, showToast, addAuditLog, setSelectedUserIdForModal } = useAlumni();

  const [records, setRecords] = useState<StudentVerificationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'registered' | 'pending'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'batch_desc' | 'batch_asc' | 'name_asc' | 'id_asc'>('batch_desc');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    fileName: string;
    items: StudentVerificationRecord[];
  } | null>(null);
  const [showBulkImporter, setShowBulkImporter] = useState(true);

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Manual record add modal / state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newName, setNewName] = useState('');
  const [newBatch, setNewBatch] = useState('2026');
  const [newCourse, setNewCourse] = useState('B.S. Information Technology');
  const [newHonors, setNewHonors] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Diagnostic match tester
  const [testInputId, setTestInputId] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load records on mount & sync registration status with existing users
  const refreshRecords = () => {
    const loaded = getRegistrarRecords();

    // Map against currently registered users to reflect real-time auto-registration links
    const synced = loaded.map((rec) => {
      const matchedUser = users.find(
        (u) =>
          (u.studentId && u.studentId.toUpperCase() === rec.studentId.toUpperCase()) ||
          (rec.email && u.email.toLowerCase() === rec.email.toLowerCase())
      );

      if (matchedUser) {
        return {
          ...rec,
          isRegistered: true,
          matchedUid: matchedUser.uid,
          registeredAt: rec.registeredAt || matchedUser.createdAt
        };
      }
      return rec;
    });

    setRecords(synced);
  };

  useEffect(() => {
    syncRegistrarRecordsWithFirestore().then(() => {
      refreshRecords();
    });
  }, [users]);

  // Handle file drop or selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const parsed = await parseRegistrarFile(file);
      if (!parsed || parsed.length === 0) {
        throw new Error('No valid student graduate records found in the file. Please check column headers.');
      }

      setParsedPreview({
        fileName: file.name,
        items: parsed
      });
      showToast(`Parsed ${parsed.length} graduate records from ${file.name}. Review and commit to registry.`);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to parse file.');
      showToast(err?.message || 'Upload error', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Commit parsed preview into official active registry
  const handleCommitUpload = () => {
    if (!parsedPreview) return;

    const res = addRegistrarRecords(
      parsedPreview.items,
      currentUser?.name || 'Registrar Office',
      parsedPreview.fileName
    );

    refreshRecords();

    addAuditLog({
      action: 'REGISTRAR_REGISTRY_UPLOAD',
      actorId: currentUser?.uid || 'registrar',
      actorName: currentUser?.name || 'Registrar Staff',
      actorRole: currentUser?.role || 'registrar',
      category: 'alumni_registration',
      details: `Uploaded ${res.added} new and updated ${res.updated} graduates via ${parsedPreview.fileName}. Total registry records: ${res.total}.`,
      severity: 'success'
    });

    showToast(`Successfully committed ${parsedPreview.items.length} records to the Academic Masterlist!`, 'success');
    setParsedPreview(null);
  };

  // Delete individual record
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove ${name} (${id}) from the official graduate registry?`)) {
      deleteRegistrarRecord(id);
      refreshRecords();

      addAuditLog({
        action: 'REGISTRY_RECORD_DELETED',
        actorId: currentUser?.uid || 'registrar',
        actorName: currentUser?.name || 'Registrar Staff',
        actorRole: currentUser?.role || 'registrar',
        category: 'registry_masterlist',
        details: `Deleted student record ${id} (${name}) from the official graduate masterlist.`,
        severity: 'warning'
      });

      showToast(`Record ${id} removed.`, 'info');
    }
  };

  // Add single graduate manually
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId || !newName) {
      showToast('Student ID and Name are required.', 'error');
      return;
    }

    const rec: StudentVerificationRecord = {
      studentId: newStudentId.trim(),
      fullName: newName.trim(),
      batchYear: newBatch.trim(),
      course: newCourse.trim(),
      status: 'Graduated',
      honors: newHonors.trim() || undefined,
      email: newEmail.trim() || undefined,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Registrar Manual Entry'
    };

    addRegistrarRecords([rec]);
    refreshRecords();

    addAuditLog({
      action: 'REGISTRY_RECORD_ADDED',
      actorId: currentUser?.uid || 'registrar',
      actorName: currentUser?.name || 'Registrar Staff',
      actorRole: currentUser?.role || 'registrar',
      category: 'registry_masterlist',
      details: `Manually added student record ${rec.studentId} (${rec.fullName}, Batch ${rec.batchYear}, ${rec.course}) to masterlist.`,
      severity: 'info'
    });

    setShowAddModal(false);
    setNewStudentId('');
    setNewName('');
    setNewHonors('');
    setNewEmail('');

    showToast(`Graduate ${rec.fullName} added to registry. Instant auto-registration ready!`, 'success');
  };

  // Test match query
  const handleTestMatch = () => {
    if (!testInputId.trim()) return;
    const res = findRegistryMatch({ studentId: testInputId.trim() });
    setTestResult(res);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Copied Student ID ${text} to clipboard!`);
  };

  // Filtered and sorted records: search by ID, name, or graduation year
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          r.studentId.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          r.batchYear.toLowerCase().includes(q) ||
          r.course.toLowerCase().includes(q) ||
          (r.email && r.email.toLowerCase().includes(q));

        const matchesBatch = selectedBatch === 'all' || r.batchYear === selectedBatch;
        const matchesStatus =
          selectedStatus === 'all' ||
          (selectedStatus === 'registered' && r.isRegistered) ||
          (selectedStatus === 'pending' && !r.isRegistered);
        const matchesCourse = selectedCourse === 'all' || r.course === selectedCourse;

        return matchesSearch && matchesBatch && matchesStatus && matchesCourse;
      })
      .sort((a, b) => {
        if (sortBy === 'batch_desc') {
          return parseInt(b.batchYear || '0', 10) - parseInt(a.batchYear || '0', 10);
        }
        if (sortBy === 'batch_asc') {
          return parseInt(a.batchYear || '0', 10) - parseInt(b.batchYear || '0', 10);
        }
        if (sortBy === 'name_asc') {
          return a.fullName.localeCompare(b.fullName);
        }
        if (sortBy === 'id_asc') {
          return a.studentId.localeCompare(b.studentId);
        }
        return 0;
      });
  }, [records, searchQuery, selectedBatch, selectedStatus, selectedCourse, sortBy]);

  // Unique batches for filter dropdown
  const batches: string[] = Array.from<string>(
    new Set<string>(records.map((r) => r.batchYear).filter((b): b is string => Boolean(b)))
  ).sort((a: string, b: string) => parseInt(b, 10) - parseInt(a, 10));

  // Unique courses for filter dropdown
  const courses: string[] = Array.from<string>(
    new Set<string>(records.map((r) => r.course).filter((c): c is string => Boolean(c)))
  ).sort();

  const registeredCount = records.filter((r) => r.isRegistered).length;
  const pendingCount = records.length - registeredCount;

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-stone-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-blue-200 text-xs font-semibold mb-3">
            <GraduationCap className="w-4 h-4 text-amber-300" />
            <span>Academic Registrar • Official Graduate Masterlist</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Institutional Registry Matcher & CSV/Excel Import
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            The Registrar can upload an official spreadsheet (CSV or Excel) containing graduating students. When students register and enter their personal details, the system matches them against this masterlist and <span className="text-emerald-300 font-bold underline">automatically registers and verifies them instantly with no manual approval needed</span>!
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs">
            <button
              onClick={() => setShowBulkImporter((prev) => !prev)}
              className={`px-4 py-2 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
                showBulkImporter
                  ? 'bg-amber-400 hover:bg-amber-300 text-stone-900 ring-2 ring-amber-300'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{showBulkImporter ? 'Hide Bulk Importer' : 'Bulk CSV/Excel Importer Utility'}</span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-black/15 rounded-md">
                Firestore
              </span>
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="View required CSV column headers and upload instructions"
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>Help & Headers</span>
            </button>

            <button
              onClick={() => {
                exportRegistryRecordsToCsv(records);
                showToast('Downloaded current registry records as CSV for offline auditing!', 'success');
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download current registry records as a CSV file for offline auditing"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Registry (CSV Audit)</span>
            </button>

            <button
              onClick={downloadSampleCsvTemplate}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download sample CSV file for student registry"
            >
              <Download className="w-4 h-4" />
              <span>Sample CSV</span>
            </button>

            <button
              onClick={downloadSampleExcelTemplate}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download sample Excel (.xlsx) file for student registry"
            >
              <FileDown className="w-4 h-4 text-emerald-300" />
              <span>Sample Excel</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Graduate</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls, .txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* CSV & Excel File Upload and Firestore Bulk Import Utility */}
      {showBulkImporter && (
        <CsvStudentBulkImporter
          onImportComplete={() => {
            refreshRecords();
          }}
          onClose={() => setShowBulkImporter(false)}
        />
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Accredited Masterlist</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">{records.length}</span>
            <span className="text-xs text-blue-600 font-medium">Graduates</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Available for instant matching</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Auto-Registered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{registeredCount}</span>
            <span className="text-xs text-emerald-600 font-medium">
              {records.length > 0 ? `${Math.round((registeredCount / records.length) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Matched & verified automatically</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Sign-Ups</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">{pendingCount}</span>
            <span className="text-xs text-amber-600 font-medium">Eligible</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Ready for 1-click auto-registration</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Verification Bypass</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-700">100%</span>
            <span className="text-xs text-purple-600 font-medium">Auto-Pass</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Zero wait time on matched records</p>
        </div>
      </div>

      {/* SUMMARY VIEW: REGISTRY MATCHING PROGRESS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-stone-900">Registry Matching Progress Summary</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Live Status
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Tracks how many accredited graduates from the uploaded registry have activated their accounts through instant auto-registration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                exportRegistryRecordsToCsv(records);
                showToast('Downloaded current registry records as CSV for offline auditing!', 'success');
              }}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Audit CSV</span>
            </button>
            <button
              onClick={refreshRecords}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-stone-700">
              Overall Student Registration Progress
            </span>
            <span className="font-bold text-stone-900">
              {registeredCount} of {records.length} registered ({records.length > 0 ? Math.round((registeredCount / records.length) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 rounded-full transition-all duration-500"
              style={{
                width: `${records.length > 0 ? Math.min(100, Math.round((registeredCount / records.length) * 100)) : 0}%`
              }}
            />
          </div>
        </div>

        {/* Progress Breakdown By Graduation Batch */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-stone-800 mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Graduation Cohort Registration Breakdown</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {batches.slice(0, 6).map((b) => {
              const batchTotal = records.filter((r) => r.batchYear === b).length;
              const batchRegistered = records.filter((r) => r.batchYear === b && r.isRegistered).length;
              const batchPct = batchTotal > 0 ? Math.round((batchRegistered / batchTotal) * 100) : 0;

              return (
                <div key={b} className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">Class of {b}</span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {batchPct}% ({batchRegistered}/{batchTotal})
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${batchPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Uploaded File Review / Confirmation Banner (If file parsed) */}
      {parsedPreview && (
        <div className="bg-blue-50/80 border-2 border-blue-400 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-950">
                  Import Preview: {parsedPreview.fileName}
                </h3>
                <p className="text-xs text-blue-800">
                  Found <span className="font-bold">{parsedPreview.items.length}</span> graduate records ready to commit.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setParsedPreview(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitUpload}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Add to Masterlist</span>
              </button>
            </div>
          </div>

          {/* Sample rows preview table */}
          <div className="overflow-x-auto max-h-48 rounded-xl border border-blue-200 bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100/80 text-stone-700 font-bold border-b border-stone-200">
                <tr>
                  <th className="p-2.5">Student ID</th>
                  <th className="p-2.5">Full Name</th>
                  <th className="p-2.5">Batch</th>
                  <th className="p-2.5">Course / Degree</th>
                  <th className="p-2.5">Honors</th>
                  <th className="p-2.5">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {parsedPreview.items.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40">
                    <td className="p-2.5 font-mono font-semibold text-blue-700">{row.studentId}</td>
                    <td className="p-2.5 font-bold">{row.fullName}</td>
                    <td className="p-2.5">{row.batchYear}</td>
                    <td className="p-2.5">{row.course}</td>
                    <td className="p-2.5 text-stone-500">{row.honors || '—'}</td>
                    <td className="p-2.5 text-stone-500">{row.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedPreview.items.length > 5 && (
            <p className="text-[11px] text-blue-700 text-center font-medium">
              + {parsedPreview.items.length - 5} more rows detected
            </p>
          )}
        </div>
      )}

      {/* Matcher Diagnostic Tester (Allows testing instant registration match) */}
      <div className="bg-stone-50/90 border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Registrar Auto-Registration Diagnostic Tool
          </h3>
        </div>
        <p className="text-xs text-stone-600">
          Enter any Student ID or Name to verify how the matcher processes their auto-registration:
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={testInputId}
              onChange={(e) => setTestInputId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestMatch()}
              placeholder="e.g. SC-2020-0192 or Juan Dela Cruz"
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleTestMatch}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
          >
            Test Matching
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs border transition-all ${
              testResult.isMatched
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {testResult.isMatched ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span>{testResult.message}</span>
            </div>

            {testResult.isMatched && testResult.record && (
              <div className="mt-2 pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-emerald-800">
                <span>
                  <strong>Student ID:</strong> {testResult.record.studentId}
                </span>
                <span>
                  <strong>Degree:</strong> {testResult.record.course}
                </span>
                <span>
                  <strong>Batch:</strong> {testResult.record.batchYear}
                </span>
                <span>
                  <strong>Status:</strong> Pre-Accredited (No Manual Verification Required)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Registry Explorer Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                Accredited Student Records Masterlist
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {filteredRecords.length} of {records.length} records
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Locate and inspect verified graduates eligible for automated instant verification
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                exportRegistryRecordsToCsv(records);
                showToast('Downloaded current registry records as CSV for offline auditing!', 'success');
              }}
              title="Download Current Registry as CSV for Offline Auditing"
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV Audit</span>
            </button>

            <button
              onClick={refreshRecords}
              title="Refresh Registry"
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dedicated Search & Filter Bar */}
        <div className="p-4 bg-stone-50/80 border-b border-stone-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Search by ID, Name, or Graduation Year */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Student ID, full name, or graduation year..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Graduation Year / Batch Filter */}
            <div className="md:col-span-2 relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Grad Years</option>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    Batch {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Registration Status Filter */}
            <div className="md:col-span-2 relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="registered">Auto-Registered</option>
                <option value="pending">Pending Sign-Up</option>
              </select>
            </div>

            {/* Academic Program / Course Filter */}
            <div className="md:col-span-3 relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 font-semibold truncate focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Academic Programs</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Metadata & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
              <span className="font-semibold text-stone-500">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 font-medium">
                  Query: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-950 font-bold ml-0.5">✕</button>
                </span>
              )}
              {selectedBatch !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 font-medium">
                  Year: {selectedBatch}
                  <button onClick={() => setSelectedBatch('all')} className="hover:text-stone-950 font-bold ml-0.5">✕</button>
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">
                  Status: {selectedStatus === 'registered' ? 'Auto-Registered' : 'Pending'}
                  <button onClick={() => setSelectedStatus('all')} className="hover:text-emerald-950 font-bold ml-0.5">✕</button>
                </span>
              )}
              {selectedCourse !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-medium truncate max-w-[200px]">
                  Course: {selectedCourse}
                  <button onClick={() => setSelectedCourse('all')} className="hover:text-purple-950 font-bold ml-0.5">✕</button>
                </span>
              )}
              {(searchQuery || selectedBatch !== 'all' || selectedStatus !== 'all' || selectedCourse !== 'all') ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBatch('all');
                    setSelectedStatus('all');
                    setSelectedCourse('all');
                  }}
                  className="text-rose-600 hover:text-rose-800 font-bold underline ml-1 cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <span className="text-stone-400">None (Displaying all official records)</span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-stone-500 font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 font-medium"
              >
                <option value="batch_desc">Batch Year (Newest)</option>
                <option value="batch_asc">Batch Year (Oldest)</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="id_asc">Student ID (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50/80 text-stone-600 font-bold border-b border-stone-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 pl-5">Student ID</th>
                <th className="p-3">Graduate Full Name</th>
                <th className="p-3">Batch & Degree</th>
                <th className="p-3">Honors / Distinction</th>
                <th className="p-3">Auto-Registration Status</th>
                <th className="p-3 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-stone-500">
                    <Search className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-stone-800">No student records found matching your search criteria</p>
                    <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto">
                      Try searching with a different Student ID, graduate name, or graduation year, or clear your active filters.
                    </p>
                    {(searchQuery || selectedBatch !== 'all' || selectedStatus !== 'all' || selectedCourse !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedBatch('all');
                          setSelectedStatus('all');
                          setSelectedCourse('all');
                        }}
                        className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reset Search & Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isReg = record.isRegistered;

                  return (
                    <tr key={record.studentId} className="hover:bg-stone-50/60 transition-colors">
                      {/* Student ID */}
                      <td className="p-3 pl-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {record.studentId}
                          </span>
                          <button
                            onClick={() => copyToClipboard(record.studentId)}
                            title="Copy Student ID"
                            className="text-stone-400 hover:text-stone-700 p-0.5 rounded"
                          >
                            {copiedId === record.studentId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Full Name */}
                      <td className="p-3 font-bold text-stone-900">
                        {record.fullName}
                        {record.email && (
                          <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                            {record.email}
                          </div>
                        )}
                      </td>

                      {/* Batch & Course */}
                      <td className="p-3">
                        <span className="font-semibold text-stone-800">Class of {record.batchYear}</span>
                        <div className="text-[11px] text-stone-500 line-clamp-1">{record.course}</div>
                      </td>

                      {/* Honors */}
                      <td className="p-3">
                        {record.honors ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {record.honors}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>

                      {/* Auto-Registration Status */}
                      <td className="p-3">
                        {isReg ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Registered & Verified</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span>Auto-Bypass Ready</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReg && record.matchedUid && (
                            <button
                              onClick={() => setSelectedUserIdForModal(record.matchedUid!)}
                              className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                            >
                              Profile
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(record.studentId, record.fullName)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Graduate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-stone-900">Add Accredited Graduate</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Student ID *</label>
                <input
                  type="text"
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="e.g. SC-2024-0811"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Christine Joyce Santos"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Batch Year *</label>
                  <input
                    type="text"
                    required
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Honors / Awards</label>
                  <input
                    type="text"
                    value={newHonors}
                    onChange={(e) => setNewHonors(e.target.value)}
                    placeholder="e.g. Cum Laude"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Degree / Course *</label>
                <input
                  type="text"
                  required
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder="B.S. Information Technology"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Student Email (Optional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@alumni.stcecilia.edu"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HELP MODAL: CSV/EXCEL COLUMN HEADERS & SCHEMA SPECIFICATION */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Registrar CSV / Excel Upload Guide & Schema
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Column specifications and accepted headers for automated masterlist matching
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Explanation */}
            <div className="text-xs text-stone-600 leading-relaxed space-y-2">
              <p>
                When uploading student records via spreadsheet (<span className="font-mono font-semibold text-blue-700">.csv</span>, <span className="font-mono font-semibold text-emerald-700">.xlsx</span>, or <span className="font-mono font-semibold text-purple-700">.xls</span>), the matching engine automatically inspects the first row for headers. It accommodates common abbreviations and column names.
              </p>
            </div>

            {/* Required and Supported Columns Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200 text-[11px]">
                  <tr>
                    <th className="p-2.5 pl-3.5">Target Field</th>
                    <th className="p-2.5">Requirement</th>
                    <th className="p-2.5">Accepted Column Headers</th>
                    <th className="p-2.5 pr-3.5">Example Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  <tr>
                    <td className="p-2.5 pl-3.5 font-bold font-mono text-blue-700">student_id</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Required
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600">
                      <code>student_id</code>, <code>id_number</code>, <code>stud_id</code>, <code>id</code>, <code>matricula</code>
                    </td>
                    <td className="p-2.5 pr-3.5 font-mono text-stone-700">SC-2022-0891</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-3.5 font-bold font-mono text-blue-700">full_name</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Required
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600">
                      <code>full_name</code>, <code>name</code>, <code>student_name</code>, <code>graduate_name</code>, <code>alumni_name</code>
                    </td>
                    <td className="p-2.5 pr-3.5 font-medium text-stone-900">Gabriel Christian Cruz</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-3.5 font-bold font-mono text-blue-700">graduation_year</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Required
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600">
                      <code>graduation_year</code>, <code>batch_year</code>, <code>batch</code>, <code>year</code>, <code>class_of</code>
                    </td>
                    <td className="p-2.5 pr-3.5 font-semibold text-stone-700">2026</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-3.5 font-bold font-mono text-stone-700">course</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                        Optional
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600">
                      <code>course</code>, <code>degree</code>, <code>program</code>, <code>major</code>
                    </td>
                    <td className="p-2.5 pr-3.5 text-stone-700">B.S. Information Technology</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-3.5 font-bold font-mono text-stone-700">honors</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                        Optional
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600">
                      <code>honors</code>, <code>distinction</code>, <code>awards</code>
                    </td>
                    <td className="p-2.5 pr-3.5 text-emerald-700 font-medium">Magna Cum Laude</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 pl-3.5 font-bold font-mono text-stone-700">email</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                        Optional
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600">
                      <code>email</code>, <code>student_email</code>, <code>institutional_email</code>
                    </td>
                    <td className="p-2.5 pr-3.5 text-stone-700">cruz.g@stcecilia.edu</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quick Tips */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1.5 text-amber-900">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Instant Auto-Registration Rule</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                When an applicant enters a matching <span className="font-mono font-bold">Student ID</span> (or identical name & batch) during registration, they are automatically verified and granted immediate access with zero waiting period or manual approval needed.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200">
              <button
                onClick={downloadSampleCsvTemplate}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample Template (.csv)</span>
              </button>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full sm:w-auto px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

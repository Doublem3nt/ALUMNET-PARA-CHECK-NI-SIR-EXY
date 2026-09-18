import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Building,
  Building2,
  Globe,
  MapPin,
  Phone,
  User,
  Shield,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  School,
  Clock,
  ShieldAlert,
  KeyRound,
  Check,
  Copy,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserRole, UserProfile, StudentVerificationRecord, OFFICIAL_DEGREE_PROGRAMS } from '../../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  verifyStudentRecord,
  findRegistryMatch,
  markRegistryRecordAsRegistered,
  getRegistrarRecords,
  isValidStudentIdPattern,
  validateStudentRegistrationStrict,
  generateAlumniId
} from '../../services/studentVerificationService';
import { getCentenaryBatchYears } from '../../services/longevityService';

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'forgot';
  initialRole?: 'alumni' | 'employer';
  onLoginSuccess?: (role: string) => void;
  onBackToApp?: () => void;
}

// Local storage keys for persistent login rate-limiting / lockout timer
const LOCKOUT_STORAGE_KEYS = {
  UNTIL: 'sc_alumni_login_lockout_until',
  ATTEMPTS: 'sc_alumni_login_failed_attempts',
  CYCLE: 'sc_alumni_login_lockout_cycle'
};

// Lockout duration math:
// First 1-3 attempts = 1 min (60s)
// Subsequent 1-3 attempts = +2 mins each trial (Trial 2 = 3m, Trial 3 = 5m, etc.)
const getLockoutDurationSeconds = (cycle: number): number => {
  return (1 + Math.max(0, cycle - 1) * 2) * 60;
};

const formatSecondsToMMSS = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  initialRole = 'alumni',
  onLoginSuccess,
  onBackToApp
}) => {
  const { login, register, users, resetUserPasswordByEmail, loginWithGoogle, addAuditLog, showToast } = useAlumni();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'email' | 'studentId'>('email');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(initialMode === 'forgot');
  const [forgotEmail, setForgotEmail] = useState('');

  const handleOpenForgotPassword = () => {
    if (loginIdentifier && loginIdentifier.includes('@')) {
      setForgotEmail(loginIdentifier.trim());
    }
    setShowForgotModal(true);
  };

  const handlePasswordResetSuccess = (email: string, newPassword?: string) => {
    // Clear any lockout constraints upon identity verification & password reset
    try {
      localStorage.removeItem(LOCKOUT_STORAGE_KEYS.UNTIL);
      localStorage.removeItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS);
      localStorage.removeItem(LOCKOUT_STORAGE_KEYS.CYCLE);
    } catch {
      // ignore
    }
    setFailedAttempts(0);
    setLockoutCycle(1);
    setLockoutSecondsRemaining(0);
    setLoginError('');

    // Prepopulate sign-in form with newly reset credentials
    setLoginMethod('email');
    setLoginIdentifier(email);
    if (newPassword) {
      setLoginPassword(newPassword);
    }
    setShowForgotModal(false);
  };

  // Failed login rate-limiting / lockout timer state
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [lockoutCycle, setLockoutCycle] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCKOUT_STORAGE_KEYS.CYCLE);
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState<number>(() => {
    try {
      const savedUntil = localStorage.getItem(LOCKOUT_STORAGE_KEYS.UNTIL);
      if (!savedUntil) return 0;
      const untilMs = parseInt(savedUntil, 10);
      const diff = Math.ceil((untilMs - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  });

  // Countdown timer effect for login lockout
  useEffect(() => {
    if (lockoutSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutSecondsRemaining((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(LOCKOUT_STORAGE_KEYS.UNTIL);
          } catch {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSecondsRemaining]);

  const isLockedOut = lockoutSecondsRemaining > 0;

  // Registration multi-step state (1: Initial Student ID Screening, 2: Account & Profile, 3: Review & Honor Pledge)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [registrationType, setRegistrationType] = useState<'alumni' | 'employer'>(initialRole);

  useEffect(() => {
    if (initialRole) {
      setRegistrationType(initialRole);
    }
  }, [initialRole]);

  // Employer Registration State
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('Information Technology & Software');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyAddress, setCompanyAddress] = useState('Cebu City, Philippines');
  const [employerContactPerson, setEmployerContactPerson] = useState('');
  const [employerEmail, setEmployerEmail] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [employerPassword, setEmployerPassword] = useState('');
  const [employerConfirmPassword, setEmployerConfirmPassword] = useState('');
  const [showEmployerPassword, setShowEmployerPassword] = useState(false);
  const [showEmployerConfirmPassword, setShowEmployerConfirmPassword] = useState(false);
  const [employerError, setEmployerError] = useState('');
  const [isSubmittingEmployer, setIsSubmittingEmployer] = useState(false);

  // Step 1: Initial Student ID Screening
  const [studentId, setStudentId] = useState('');
  const [screeningError, setScreeningError] = useState('');
  const [studentVerificationStatus, setStudentVerificationStatus] = useState<
    'idle' | 'checking' | 'verified' | 'failed'
  >('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verifiedRecord, setVerifiedRecord] = useState<StudentVerificationRecord | null>(null);
  const [isRegistryMatched, setIsRegistryMatched] = useState(false);

  // Step 2: Account Details & Profile Credentials
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [batch, setBatch] = useState('2024');
  const [course, setCourse] = useState('B.S. Information Technology');
  const [location, setLocation] = useState('Cebu, Philippines');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [step2Error, setStep2Error] = useState('');

  // 100-Year Centenary batches (from 1968 to 50 years into the future)
  const centenaryBatches = React.useMemo(() => getCentenaryBatchYears(1968, 50), []);

  // Degree Program options from official registry & accredited offerings
  const allDegreeOptions = React.useMemo(() => {
    const list: string[] = [...OFFICIAL_DEGREE_PROGRAMS];
    const records = getRegistrarRecords();
    records.forEach((r) => {
      if (r.course && !list.includes(r.course)) {
        list.push(r.course);
      }
    });
    return list;
  }, []);

  // Compute preview Alumni ID (Distinct from Student ID)
  const previewAlumniId = React.useMemo(() => {
    return generateAlumniId(batch, studentId);
  }, [batch, studentId]);

  // Step 1 Screening Verification Handler (Strict Zero-Tolerance Registry Enforcement)
  const handleVerifyStudentClick = async (
    e?: React.MouseEvent | React.FormEvent,
    overrideId?: string,
    overrideFirst?: string,
    overrideLast?: string,
    overrideBatch?: string,
    overrideCourse?: string
  ) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    const targetId = (overrideId || studentId).trim();
    const targetFirst = (overrideFirst !== undefined ? overrideFirst : firstName).trim();
    const targetLast = (overrideLast !== undefined ? overrideLast : lastName).trim();
    const targetBatch = (overrideBatch !== undefined ? overrideBatch : batch).trim();
    const targetCourse = (overrideCourse !== undefined ? overrideCourse : course).trim();

    if (!targetId) {
      setScreeningError('Please enter your St. Cecilia’s Student ID (format: SCC-YYYY-XXXX) to verify.');
      return;
    }

    if (!targetFirst || !targetLast) {
      setScreeningError('Security Challenge Required: Please enter your complete First Name and Last Name as recorded in the registrar.');
      setStudentVerificationStatus('failed');
      setVerificationMessage('Ownership verification failed: First Name and Last Name are required to authenticate your ownership of this Student ID.');
      return;
    }

    if (!targetBatch) {
      setScreeningError('Please select your Graduating Batch Year.');
      setStudentVerificationStatus('failed');
      setVerificationMessage('Graduation batch year is required to verify ownership of this Student ID.');
      return;
    }

    if (!targetCourse) {
      setScreeningError('Please select your Degree Program.');
      setStudentVerificationStatus('failed');
      setVerificationMessage('Degree Program is required to verify ownership of this Student ID.');
      return;
    }

    setScreeningError('');
    setStudentVerificationStatus('checking');

    // Strict zero-tolerance validation against registrar masterlist
    const validation = validateStudentRegistrationStrict(
      {
        studentId: targetId,
        firstName: targetFirst,
        lastName: targetLast,
        batch: targetBatch,
        course: targetCourse
      },
      users
    );

    if (validation.isValid && validation.matchedRecord) {
      setStudentVerificationStatus('verified');
      setIsRegistryMatched(true);
      setVerifiedRecord(validation.matchedRecord);
      setVerificationMessage(
        `Official Registrar Masterlist Match! Identity and ownership confirmed for Student ID ${targetId}. Exact academic credentials authenticated.`
      );
      setScreeningError('');
    } else {
      setStudentVerificationStatus('failed');
      setIsRegistryMatched(false);
      setVerifiedRecord(null);
      const msg = validation.errorMessage || 'Security Verification Failed: The provided Student ID, Name, Graduating Batch, or Degree Program does not match the official registrar masterlist.';
      setScreeningError(msg);
      setVerificationMessage(msg);
    }
  };

  // Step 3: Terms, Privacy & Zero Disclosure Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacyConsent, setAgreedToPrivacyConsent] = useState(false);
  const [agreedToZeroDisclosure, setAgreedToZeroDisclosure] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Password requirements validation
  const hasMinLength = regPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  // Handle Login submission with strict rate-limiting and progressive lockout timers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (isLockedOut) {
      setLoginError(
        `Account temporarily locked due to failed attempts. Please wait ${formatSecondsToMMSS(
          lockoutSecondsRemaining
        )} before attempting to sign in again.`
      );
      return;
    }

    if (!loginIdentifier.trim()) {
      setLoginError(loginMethod === 'email' ? 'Please enter your email address.' : 'Please enter your Student ID.');
      return;
    }

    const trimmed = loginIdentifier.trim().toLowerCase();
    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        (u.studentId && u.studentId.toLowerCase() === trimmed) ||
        (u.employeeId && u.employeeId.toLowerCase() === trimmed)
    );

    const success = login(loginIdentifier.trim(), loginPassword);
    if (success) {
      // Clear all lockout state on successful authentication
      try {
        localStorage.removeItem(LOCKOUT_STORAGE_KEYS.UNTIL);
        localStorage.removeItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS);
        localStorage.removeItem(LOCKOUT_STORAGE_KEYS.CYCLE);
      } catch {
        // ignore
      }
      setFailedAttempts(0);
      setLockoutCycle(1);
      setLockoutSecondsRemaining(0);

      const userRole = matchedUser?.role || 'alumni';
      if (onLoginSuccess) {
        onLoginSuccess(userRole);
      } else if (onBackToApp) {
        onBackToApp();
      }
    } else {
      // Failed login attempt tracking
      const newAttempts = failedAttempts + 1;

      if (newAttempts >= 3) {
        // Reached 3 failed attempts in current trial -> trigger lockout
        const durationSec = getLockoutDurationSeconds(lockoutCycle);
        const untilMs = Date.now() + durationSec * 1000;
        const nextCycle = lockoutCycle + 1;

        try {
          localStorage.setItem(LOCKOUT_STORAGE_KEYS.UNTIL, untilMs.toString());
          localStorage.setItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS, '0');
          localStorage.setItem(LOCKOUT_STORAGE_KEYS.CYCLE, nextCycle.toString());
        } catch {
          // ignore
        }

        setLockoutSecondsRemaining(durationSec);
        setFailedAttempts(0);
        setLockoutCycle(nextCycle);
        setLoginError('');
      } else {
        // 1st or 2nd failed attempt in current trial
        setFailedAttempts(newAttempts);
        try {
          localStorage.setItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS, newAttempts.toString());
        } catch {
          // ignore
        }
        const trialDurationMins = Math.round(getLockoutDurationSeconds(lockoutCycle) / 60);
        const attemptsRemaining = 3 - newAttempts;
        setLoginError(
          `Invalid email/Student ID or password. (${newAttempts} of 3 attempts used). Warning: ${attemptsRemaining} attempt${
            attemptsRemaining > 1 ? 's' : ''
          } remaining before a ${trialDurationMins}-minute account lockout.`
        );
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setLoginError('');
    try {
      const success = await loginWithGoogle();
      if (success) {
        try {
          localStorage.removeItem(LOCKOUT_STORAGE_KEYS.UNTIL);
          localStorage.removeItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS);
          localStorage.removeItem(LOCKOUT_STORAGE_KEYS.CYCLE);
        } catch {
          // ignore
        }
        setFailedAttempts(0);
        setLockoutCycle(1);
        setLockoutSecondsRemaining(0);

        if (onLoginSuccess) {
          onLoginSuccess('alumni');
        } else if (onBackToApp) {
          onBackToApp();
        }
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Step 1 Screening Validation -> Proceed to Step 2 Account & Profile (Strict Zero-Tolerance Registry Check)
  const handleProceedFromStep1ToStep2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setScreeningError('');

    const targetId = studentId.trim();
    if (!targetId) {
      setScreeningError('Please enter your St. Cecilia’s Student ID Number (format: SCC-YYYY-XXXX) to proceed.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setScreeningError('Security Challenge Required: Please enter your complete First Name and Last Name as recorded in the registrar.');
      setStudentVerificationStatus('failed');
      setVerificationMessage('To protect student privacy and prevent unauthorized account registration, your full name, graduating batch, and degree program are required.');
      return;
    }

    if (!batch.trim()) {
      setScreeningError('Please select your Graduating Batch Year.');
      setStudentVerificationStatus('failed');
      return;
    }

    if (!course.trim()) {
      setScreeningError('Please select your Degree Program from the list.');
      setStudentVerificationStatus('failed');
      return;
    }

    // Run real-time strict zero-tolerance screening check against registrar masterlist
    setStudentVerificationStatus('checking');

    const validation = validateStudentRegistrationStrict(
      {
        studentId: targetId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        batch: batch.trim(),
        course: course.trim()
      },
      users
    );

    // If ANY detail does not match, STRICTLY CANNOT proceed to Step 2!
    if (!validation.isValid || !validation.matchedRecord) {
      setStudentVerificationStatus('failed');
      setIsRegistryMatched(false);
      setVerifiedRecord(null);
      const msg = validation.errorMessage || 'Security Verification Failed: The provided Student ID, Name, Graduating Batch, or Degree Program does not match the official registrar masterlist.';
      setScreeningError(msg);
      setVerificationMessage(msg);
      return; // DO NOT LET THEM PASS TO STEP 2
    }

    // All details match 100% exactly
    setStudentVerificationStatus('verified');
    setIsRegistryMatched(true);
    setVerifiedRecord(validation.matchedRecord);
    setVerificationMessage(
      `Official Registrar Masterlist Match! Identity and ownership confirmed for Student ID ${targetId}.`
    );
    setStep(2);
  };

  // Step 2 Validation -> Proceed to Step 3 Review & Honor Pledge
  const handleProceedFromStep2ToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error('');

    if (!firstName.trim() || !lastName.trim()) {
      setStep2Error('First and Last Name are required.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setStep2Error('A valid email address is required.');
      return;
    }
    if (!isPasswordValid) {
      setStep2Error('Please ensure password satisfies all security requirements (8+ chars, uppercase, number).');
      return;
    }
    if (regPassword !== confirmPassword) {
      setStep2Error('Passwords do not match.');
      return;
    }
    if (!course.trim()) {
      setStep2Error('Degree Program or Course is required.');
      return;
    }

    setStep(3);
  };

  // Step 3 Submit Registration (Strictly Alumni Role)
  const handleCompleteRegistration = () => {
    if (!agreedToPrivacyConsent || !agreedToZeroDisclosure || !agreedToTerms) {
      alert('Please confirm all required consents (Data Privacy Consent, Zero Disclosure Agreement, and Honor Pledge) to complete registration.');
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const generatedHeadline = headline.trim() || `${course} Graduate • Class of ${batch}`;
    const isAutoVerified = studentVerificationStatus === 'verified' || isRegistryMatched;
    const finalStudentId = studentId.trim();
    const generatedAlumniId = generateAlumniId(batch, finalStudentId);

    const registered = register({
      name: fullName,
      email: regEmail.trim(),
      password: regPassword,
      role: 'alumni', // Exclusively Alumni
      batch,
      course,
      location: location.trim() || 'Cebu, Philippines',
      headline: generatedHeadline,
      phone: phone.trim() || '+63 917 123 4567',
      studentId: finalStudentId,
      alumniId: generatedAlumniId,
      isVerified: isAutoVerified
    });

    if (!registered) {
      return;
    }

    if (finalStudentId) {
      markRegistryRecordAsRegistered(finalStudentId, `user_${Date.now()}`);
      addAuditLog({
        action: 'INSTANT_REGISTRY_AUTO_REGISTRATION',
        actorId: 'alumni_registration_screening',
        actorName: fullName,
        actorRole: 'alumni',
        category: 'alumni_registration',
        details: `Alumnus completed screening and registered with verified Student ID (${finalStudentId}) and Official Alumni ID (${generatedAlumniId}). Account pre-authenticated and registered into Cecilian alumni network.`,
        severity: 'success'
      });
      showToast(`🎉 Welcome to St. Cecilia's Alumni Network, ${fullName}! Your Official Alumni ID is ${generatedAlumniId}`, 'success');
    }

    setRegistrationComplete(true);
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess('alumni');
      } else if (onBackToApp) {
        onBackToApp();
      }
    }, 1200);
  };

  // Employer Registration Form Handler
  const handleEmployerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setEmployerError('');

    if (!companyName.trim()) {
      setEmployerError('Company / Organization Name is required.');
      return;
    }
    if (!employerContactPerson.trim()) {
      setEmployerError('Contact Person / HR Representative full name is required.');
      return;
    }
    if (!employerEmail.trim() || !employerEmail.includes('@')) {
      setEmployerError('A valid corporate work email address is required.');
      return;
    }
    if (!employerPassword || employerPassword.length < 6) {
      setEmployerError('Password must be at least 6 characters long.');
      return;
    }
    if (employerPassword !== employerConfirmPassword) {
      setEmployerError('Passwords do not match.');
      return;
    }

    // Check duplicate email
    const existing = users.find((u) => u.email.toLowerCase() === employerEmail.trim().toLowerCase());
    if (existing) {
      setEmployerError(`An account with email "${employerEmail}" is already registered. Please sign in or use a different email.`);
      return;
    }

    setIsSubmittingEmployer(true);

    const registered = register({
      role: 'employer',
      name: employerContactPerson.trim(),
      email: employerEmail.trim().toLowerCase(),
      password: employerPassword,
      companyName: companyName.trim(),
      companyIndustry: companyIndustry.trim(),
      companyWebsite: companyWebsite.trim() ? (companyWebsite.startsWith('http') ? companyWebsite.trim() : `https://${companyWebsite.trim()}`) : '',
      companyAddress: companyAddress.trim() || 'Cebu City, Philippines',
      location: companyAddress.trim() || 'Cebu City, Philippines',
      phone: employerPhone.trim() || '+63 917 123 4567',
      contactPhone: employerPhone.trim() || '+63 917 123 4567',
      contactPerson: employerContactPerson.trim(),
      headline: `Hiring Partner • ${companyName.trim()}`,
      isVerified: false,
      verified: false
    });

    if (!registered) {
      setIsSubmittingEmployer(false);
      setEmployerError('Registration could not be completed. Please review your details.');
      return;
    }

    addAuditLog({
      action: 'EMPLOYER_REGISTER',
      actorId: 'new_employer',
      actorName: employerContactPerson.trim(),
      actorRole: 'employer',
      category: 'user_management',
      details: `Employer partner registered: "${companyName.trim()}" by ${employerContactPerson.trim()} (${employerEmail.trim()}). Account provisioned for employer portal access, pending accreditation verification.`,
      severity: 'info'
    });

    setRegistrationComplete(true);
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess('employer');
      } else if (onBackToApp) {
        onBackToApp();
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex bg-stone-900 text-stone-800 font-sans">
      
      {/* ================= LEFT HALF: DARK ARCHITECTURE HERO ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Background Image with Dark Vignette - St. Cecilia's College Building Photo */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/landing-building-2.jpg"
            alt="St. Cecilia's College Architecture"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-45 filter contrast-110 brightness-80 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/50" />
        </div>

        {/* Top Bar: Back Button */}
        <div className="relative z-10">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="inline-flex items-center gap-1.5 text-stone-300 hover:text-white text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Public Page</span>
            </button>
          )}
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          {/* Eyebrow with Team Seal */}
          <div className="flex items-center gap-2.5 mb-4">
            <img
              src="/assets/cecilians-seal.jpg"
              alt="Alumni Cecilian's Logo"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-white/20 shadow-sm"
            />
            <span className="w-5 h-[2px] bg-[#991B1B]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#fca5a5]">
              ST. CECILIA'S • ALUMNI
            </span>
          </div>

          {/* Large Serif Heading */}
          <h1 className="font-serif text-5xl xl:text-6xl font-normal text-white tracking-tight leading-[1.1] mb-5">
            {mode === 'login'
              ? 'Welcome Back.'
              : registrationType === 'employer'
              ? 'Hiring Partner Network.'
              : 'Join the Network.'}
          </h1>

          {/* Subtitle */}
          <p className="text-stone-300 text-base xl:text-lg leading-relaxed font-light mb-8">
            {mode === 'login'
              ? 'Sign in to access your alumni network, events, and career opportunities.'
              : registrationType === 'employer'
              ? 'Register your organization to hire certified Cecilian graduates, publish job openings, and access our career recruitment portal.'
              : "Apply for exclusive access to the St. Cecilia's alumni community."}
          </p>

          {/* Stepper (Only on Register Mode) */}
          {mode === 'register' && (
            registrationType === 'employer' ? (
              <div className="space-y-4 pt-4 border-t border-white/10 max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#8B181B] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm font-bold text-white">Company Registration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-white/40 text-white/50 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="text-sm font-medium text-stone-400">Accreditation Verification</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-white/10 max-w-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step === 1
                        ? 'bg-white text-stone-950 shadow-md'
                        : step > 1
                        ? 'bg-[#8B181B] text-white'
                        : 'border border-white/40 text-white/50'
                    }`}
                  >
                    {step > 1 ? '✓' : '1'}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === 1 ? 'text-white font-bold' : step > 1 ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    Student ID Screening
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step === 2
                        ? 'bg-white text-stone-950 shadow-md'
                        : step > 2
                        ? 'bg-[#8B181B] text-white'
                        : 'border border-white/40 text-white/50'
                    }`}
                  >
                    {step > 2 ? '✓' : '2'}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === 2 ? 'text-white font-bold' : step > 2 ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    Account & Profile
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step === 3
                        ? 'bg-white text-stone-950 shadow-md'
                        : 'border border-white/40 text-white/50'
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === 3 ? 'text-white font-bold' : 'text-stone-500'
                    }`}
                  >
                    Review & Pledge
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Notes */}
        <div className="relative z-10 text-xs text-stone-400 font-light flex items-center gap-2">
          <span>St. Cecilia's College Global Alumni Association</span>
          <span>•</span>
          <span>Institutional Portal</span>
        </div>
      </div>

      {/* ================= RIGHT HALF: CLEAN WHITE FORM ================= */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-6 sm:px-12 xl:px-20 py-12 overflow-y-auto max-h-screen">
        
        {/* Mobile Header (When screen is small) */}
        <div className="lg:hidden mb-6 pb-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/assets/cecilians-seal.jpg"
                alt="Alumni Cecilian's Logo"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-stone-200"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
                St. Cecilia's Alumni
              </span>
            </div>
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                Back to App
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            VIEW A: SIGN IN FORM (Matches Screenshot 2)
            ======================================================== */}
        {mode === 'login' && (
          <div className="max-w-md w-full mx-auto">
            {/* Form Title & Subtitle */}
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-sm text-stone-500 font-normal mb-6">
              Enter your credentials to access the portal.
            </p>

            {/* Prominent Live Countdown Lockout Banner or Error State */}
            {isLockedOut ? (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-red-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        Account Temporarily Locked
                      </h4>
                      <span className="font-mono text-sm font-black px-2.5 py-0.5 rounded-md bg-red-600 text-white tracking-widest shadow-xs">
                        {formatSecondsToMMSS(lockoutSecondsRemaining)}
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-1.5 leading-relaxed">
                      Too many consecutive failed sign-in attempts (3 of 3). For security, sign-in is suspended. Please wait until the timer finishes before trying again.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-red-200 text-[11px] text-red-700 flex items-center justify-between flex-wrap gap-2">
                      <span>Rate limit rule: 1st trial = 1 min (+2 mins each subsequent trial)</span>
                      <button
                        type="button"
                        onClick={handleOpenForgotPassword}
                        className="font-bold underline text-red-900 hover:text-red-950 cursor-pointer"
                      >
                        Reset Credentials via Email
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : loginError ? (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">{loginError}</p>
                </div>
              </div>
            ) : failedAttempts > 0 ? (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-medium">
                  {failedAttempts} of 3 attempts used in this trial. {3 - failedAttempts} attempt{3 - failedAttempts > 1 ? 's' : ''} remaining before temporary lockout.
                </span>
              </div>
            ) : null}

            {/* Email / Student ID Pill Toggle */}
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                disabled={isLockedOut}
                onClick={() => setLoginMethod('email')}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                } ${isLockedOut ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Mail className={`w-3.5 h-3.5 ${loginMethod === 'email' ? 'text-[#8B181B]' : ''}`} />
                <span>Email</span>
              </button>

              <button
                type="button"
                disabled={isLockedOut}
                onClick={() => setLoginMethod('studentId')}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  loginMethod === 'studentId'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                } ${isLockedOut ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <GraduationCap className={`w-3.5 h-3.5 ${loginMethod === 'studentId' ? 'text-[#8B181B]' : ''}`} />
                <span>Student ID</span>
              </button>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Identifier Field */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  {loginMethod === 'email' ? 'EMAIL ADDRESS' : 'STUDENT ID NUMBER'}
                </label>
                <input
                  type={loginMethod === 'email' ? 'email' : 'text'}
                  required
                  disabled={isLockedOut}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={loginMethod === 'email' ? 'e.g. juan@email.com' : 'e.g. SC-2020-0192'}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] transition-all disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-xs text-[#8B181B] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    disabled={isLockedOut}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-4 pr-10 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] transition-all disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled={isLockedOut}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 disabled:opacity-50"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Stay Signed In */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="staySignedIn"
                  disabled={isLockedOut}
                  checked={staySignedIn}
                  onChange={(e) => setStaySignedIn(e.target.checked)}
                  className="w-4 h-4 text-[#8B181B] rounded border-stone-300 focus:ring-[#8B181B] disabled:cursor-not-allowed"
                />
                <label htmlFor="staySignedIn" className="text-xs text-stone-600 select-none">
                  Stay signed in
                </label>
              </div>

              {/* Red Submit Button with dynamic lockout countdown */}
              <button
                type="submit"
                disabled={isLockedOut}
                className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-md ${
                  isLockedOut
                    ? 'bg-stone-300 text-stone-600 cursor-not-allowed shadow-none'
                    : 'bg-[#8B181B] hover:bg-[#721316] text-white hover:shadow-lg cursor-pointer'
                }`}
              >
                {isLockedOut
                  ? `LOCKED — TRY AGAIN IN ${formatSecondsToMMSS(lockoutSecondsRemaining)}`
                  : 'SIGN IN'}
              </button>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  or
                </span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                disabled={isLockedOut || isGoogleLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-[#8B181B] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>

              {/* Bottom Switcher */}
              <div className="text-center pt-2 text-xs text-stone-500 space-y-1.5">
                <div>
                  Don't have an alumni account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setRegistrationType('alumni');
                      setStep(1);
                    }}
                    className="text-[#8B181B] font-bold hover:underline cursor-pointer"
                  >
                    Register as Alumnus
                  </button>
                </div>
                <div className="text-stone-400">
                  Looking to hire Cecilians?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setRegistrationType('employer');
                    }}
                    className="text-[#8B181B] font-bold hover:underline cursor-pointer"
                  >
                    Register as Employer Partner
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            VIEW B: MULTI-STEP REGISTRATION (Matches Screenshot 1)
            ======================================================== */}
        {mode === 'register' && (
          <div className="max-w-md w-full mx-auto">
            {registrationComplete ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  {registrationType === 'employer' ? 'Company Registration Received!' : "Welcome to St. Cecilia's Alumni!"}
                </h3>
                <p className="text-sm text-stone-500 mt-2">
                  {registrationType === 'employer'
                    ? 'Your employer profile has been established. Redirecting to your Employer Career & Hiring Portal...'
                    : 'Your profile has been generated successfully. Redirecting you to the portal...'}
                </p>
              </div>
            ) : (
              <>
                {/* If user navigated to Employer Registration, provide clean back link to Alumni Registration */}
                {registrationType === 'employer' && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationType('alumni');
                        setEmployerError('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Alumni Registration</span>
                    </button>
                  </div>
                )}

                {registrationType === 'employer' ? (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-[#8B181B] mb-2 border border-red-200">
                      <Building2 className="w-3 h-3" />
                      Corporate Accreditation & Recruitment Partner
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-1">
                      Register Organization
                    </h2>
                    <p className="text-sm text-stone-500 font-normal mb-4">
                      Create an employer account to post career opportunities, browse candidate profiles, and hire certified Cecilian graduates.
                    </p>

                    {/* Notice Banner */}
                    <div className="mb-5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <Briefcase className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="font-bold">Employer Placement Accreditation:</span>{' '}
                        <span>
                          Account credentials allow instant access to candidate listings. The Alumni & Placement Office verifies company details before job posts are published to alumni.
                        </span>
                      </div>
                    </div>

                    {employerError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{employerError}</span>
                      </div>
                    )}

                    <form onSubmit={handleEmployerRegister} className="space-y-4">
                      {/* Company Name */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Company / Organization Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g., TechSolutions Philippines Inc."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                          />
                        </div>
                      </div>

                      {/* Industry & Website */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Industry Sector <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={companyIndustry}
                            onChange={(e) => setCompanyIndustry(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                          >
                            <option value="Information Technology & Software">Information Technology & Software</option>
                            <option value="BPO & Shared Services">BPO & Shared Services</option>
                            <option value="Healthcare & Nursing">Healthcare & Nursing</option>
                            <option value="Education & Academics">Education & Academics</option>
                            <option value="Engineering & Construction">Engineering & Construction</option>
                            <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                            <option value="Banking & Financial Services">Banking & Financial Services</option>
                            <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                            <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                            <option value="Government & Public Sector">Government & Public Sector</option>
                            <option value="Other Industry">Other Industry</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Company Website <span className="text-stone-400 font-normal">(optional)</span>
                          </label>
                          <div className="relative">
                            <Globe className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={companyWebsite}
                              onChange={(e) => setCompanyWebsite(e.target.value)}
                              placeholder="https://company.com"
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Office Address / Location */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Office / Headquarters Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            placeholder="e.g., Cebu IT Park, Apas, Cebu City"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                          />
                        </div>
                      </div>

                      {/* Contact Person Name & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Contact Person <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={employerContactPerson}
                              onChange={(e) => setEmployerContactPerson(e.target.value)}
                              placeholder="e.g., Juan Dela Cruz (HR)"
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Phone / Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              required
                              value={employerPhone}
                              onChange={(e) => setEmployerPhone(e.target.value)}
                              placeholder="+63 917 123 4567"
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Work Email */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Official Corporate Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={employerEmail}
                            onChange={(e) => setEmployerEmail(e.target.value)}
                            placeholder="careers@company.com or hr@company.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                          />
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1">This email will be used for applicant notifications and corporate login.</p>
                      </div>

                      {/* Passwords */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type={showEmployerPassword ? 'text' : 'password'}
                              required
                              value={employerPassword}
                              onChange={(e) => setEmployerPassword(e.target.value)}
                              placeholder="Min. 6 chars"
                              className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEmployerPassword(!showEmployerPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                              {showEmployerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type={showEmployerConfirmPassword ? 'text' : 'password'}
                              required
                              value={employerConfirmPassword}
                              onChange={(e) => setEmployerConfirmPassword(e.target.value)}
                              placeholder="Re-enter password"
                              className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEmployerConfirmPassword(!showEmployerConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                              {showEmployerConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Policy acknowledgement */}
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
                        <span>
                          By registering, you certify that you are an authorized representative of this organization and agree to maintain ethical recruitment standards and Cecilian student privacy.
                        </span>
                      </div>

                      {/* Action Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingEmployer}
                        className="w-full py-3.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-md shadow-red-950/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingEmployer ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Building2 className="w-4 h-4" />
                            <span>REGISTER COMPANY ACCOUNT</span>
                          </>
                        )}
                      </button>

                      {/* Switch to login */}
                      <div className="text-center pt-2 text-xs text-stone-500">
                        Already have an employer account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                          }}
                          className="text-[#8B181B] font-bold hover:underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* NOTICE BANNER: ALUMNI-ONLY REGISTRATION (Only on Step 1) */}
                    {step === 1 && (
                      <div className="mb-5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                        <GraduationCap className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          <span className="font-bold">Official Cecilian Alumni Registration:</span>{' '}
                          <span>
                            Exclusively for graduates and alumni of St. Cecilia’s College. Faculty, staff, and administrators receive pre-configured credentials directly from the Registrar and IT Services.
                          </span>
                        </div>
                      </div>
                    )}

                {/* STEP 1: INITIAL ACADEMIC SCREENING VIA STUDENT ID & ZERO-LEAK OWNERSHIP CHALLENGE */}
                {step === 1 && (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-[#8B181B] mb-2 border border-red-200">
                      <ShieldCheck className="w-3 h-3" />
                      Step 1 of 3 • Security Verification & Academic Screening
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-1">
                      Verify Student ID
                    </h2>
                    <p className="text-sm text-stone-500 font-normal mb-4">
                      To preserve alumni community integrity and prevent unauthorized registration using stolen IDs, enter your St. Cecilia's Student ID and confirm your identity credentials below.
                    </p>

                    {/* Zero-Leak Security Policy Notice */}
                    <div className="mb-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold text-stone-900">Zero-Leak Security Protocol:</span>{' '}
                        <span>
                          Stored registrar records are strictly protected. To prove you own this Student ID, you must provide your matching name and graduation year. Personal details are never auto-revealed to unauthenticated users.
                        </span>
                      </div>
                    </div>

                    {screeningError && (
                      <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{screeningError}</span>
                      </div>
                    )}

                    <form onSubmit={handleProceedFromStep1ToStep2} className="space-y-3.5">
                      {/* Student ID Input with Real-time Check */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                            STUDENT ID NUMBER *
                          </label>
                          <span className="text-[10px] text-stone-400 font-mono">
                            Format: SCC-YYYY-XXXX
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={studentId}
                            onChange={(e) => {
                              setStudentId(e.target.value);
                              if (studentVerificationStatus !== 'idle') {
                                setStudentVerificationStatus('idle');
                                setVerificationMessage('');
                              }
                            }}
                            placeholder="e.g. SCC-2020-0192"
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-mono tracking-wide transition-all ${
                              studentVerificationStatus === 'verified'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold'
                                : studentVerificationStatus === 'failed'
                                ? 'border-red-400 ring-2 ring-red-400/20'
                                : 'border-stone-200 focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]'
                            }`}
                          />
                          {studentVerificationStatus === 'verified' && (
                            <Check className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </div>

                      {/* Security Challenge: First and Last Name */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            YOUR FIRST NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => {
                              setFirstName(e.target.value);
                              if (studentVerificationStatus !== 'idle') {
                                setStudentVerificationStatus('idle');
                                setVerificationMessage('');
                              }
                            }}
                            placeholder="e.g. Juan"
                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            YOUR LAST NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => {
                              setLastName(e.target.value);
                              if (studentVerificationStatus !== 'idle') {
                                setStudentVerificationStatus('idle');
                                setVerificationMessage('');
                              }
                            }}
                            placeholder="e.g. Dela Cruz"
                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          />
                        </div>
                      </div>

                      {/* Security Challenge: Graduating Batch & Degree */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            GRADUATING BATCH *
                          </label>
                          <select
                            value={batch}
                            onChange={(e) => {
                              setBatch(e.target.value);
                              if (studentVerificationStatus !== 'idle') {
                                setStudentVerificationStatus('idle');
                                setVerificationMessage('');
                              }
                            }}
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          >
                            {centenaryBatches.map((yr) => (
                              <option key={yr} value={yr}>
                                Class of {yr}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            DEGREE PROGRAM *
                          </label>
                          <select
                            value={course}
                            onChange={(e) => {
                              setCourse(e.target.value);
                              if (studentVerificationStatus !== 'idle') {
                                setStudentVerificationStatus('idle');
                                setVerificationMessage('');
                              }
                            }}
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          >
                            {allDegreeOptions.map((prog) => (
                              <option key={prog} value={prog}>
                                {prog}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Verify Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          disabled={studentVerificationStatus === 'checking' || !studentId.trim()}
                          onClick={(e) => handleVerifyStudentClick(e)}
                          className="w-full px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {studentVerificationStatus === 'checking' ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Validating Identity Credentials...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-amber-400" />
                              <span>Verify & Authenticate Ownership</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Verification Status Card */}
                      {studentVerificationStatus === 'verified' && (
                        <div
                          className={`p-4 border rounded-2xl space-y-2 animate-in fade-in ${
                            isRegistryMatched
                              ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <CheckCircle2
                                className={`w-4 h-4 ${
                                  isRegistryMatched ? 'text-blue-600' : 'text-emerald-600'
                                }`}
                              />
                              <span>
                                {isRegistryMatched
                                  ? 'Official Registrar Match • Ownership Authenticated'
                                  : 'St. Cecilia’s College Record Confirmed'}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isRegistryMatched
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              SCREENED & APPROVED
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed text-stone-700">
                            {verificationMessage}
                          </p>

                          <div className="pt-2 border-t border-stone-200/60 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase block">Verified Student</span>
                              <span className="font-bold text-stone-900">{firstName} {lastName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase block">Graduation Batch</span>
                              <span className="font-bold text-stone-900">Class of {batch}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {studentVerificationStatus === 'failed' && (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1.5 animate-in fade-in">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                            <span>Academic Record Not Confirmed</span>
                          </div>
                          <p className="text-xs text-red-700 leading-tight">
                            {verificationMessage}
                          </p>
                        </div>
                      )}

                      {/* Zero-Leak Student Privacy & Anti-Theft Shield */}
                      <div className="p-3.5 bg-stone-50 border border-stone-200/90 rounded-xl space-y-2">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 shrink-0 mt-0.5">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-stone-900 block">
                              Zero-Disclosure Identity Protection
                            </span>
                            <p className="text-[11px] text-stone-600 leading-relaxed">
                              To prevent account theft or unauthorized registration with lost/stolen Student IDs, St. Cecilia’s College enforces zero personal detail disclosure. You must independently provide your matching First Name, Last Name, and Graduating Batch to authenticate ownership.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Next Button */}
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Account Setup</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {/* Sign In link */}
                      <div className="text-center pt-2 text-xs text-stone-500">
                        Already have an alumni account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          className="text-[#8B181B] font-bold hover:underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* STEP 2: ACCOUNT DETAILS & CREDENTIALS */}
                {step === 2 && (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-stone-100 text-stone-700 mb-2 border border-stone-200">
                      <GraduationCap className="w-3 h-3 text-[#8B181B]" />
                      Step 2 of 3 • Account & Profile
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-1">
                      Account Credentials
                    </h2>
                    <p className="text-sm text-stone-500 font-normal mb-4">
                      Create your portal login credentials and verify your alumni profile.
                    </p>

                    {/* Verified Student ID & Alumni ID Banner */}
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-800 font-bold uppercase">Screened Student ID:</span>
                            <span className="font-mono font-bold text-emerald-950">{studentId}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#8B181B] font-bold uppercase">Official Alumni ID:</span>
                            <span className="font-mono font-bold text-stone-900">{previewAlumniId}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[10px] text-[#8B181B] font-bold hover:underline cursor-pointer shrink-0"
                      >
                        Change ID
                      </button>
                    </div>

                    {step2Error && (
                      <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
                        {step2Error}
                      </div>
                    )}

                    <form onSubmit={handleProceedFromStep2ToStep3} className="space-y-3.5">
                      {/* First & Last Name */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            FIRST NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Juan"
                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            LAST NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Dela Cruz"
                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                          ALUMNI EMAIL ADDRESS *
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="juan.delacruz@alumni.stcecilias.edu.ph"
                          className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                        />
                      </div>

                      {/* Course and Batch (Centenary dropdown) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            GRADUATION BATCH *
                          </label>
                          <select
                            value={batch}
                            onChange={(e) => setBatch(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          >
                            {centenaryBatches.map((yr) => (
                              <option key={yr} value={yr}>
                                Class of {yr}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            DEGREE PROGRAM *
                          </label>
                          <select
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          >
                            {allDegreeOptions.map((prog) => (
                              <option key={prog} value={prog}>
                                {prog}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                          PORTAL PASSWORD *
                        </label>
                        <div className="relative">
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                          >
                            {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Bullets Requirements */}
                        <div className="mt-2 space-y-1 text-xs text-stone-500">
                          <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-600 font-medium' : ''}`}>
                            <span className="w-2.5 h-2.5 rounded-full border border-current flex items-center justify-center text-[8px]">
                              {hasMinLength ? '✓' : '○'}
                            </span>
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`flex items-center gap-2 ${hasUppercase ? 'text-emerald-600 font-medium' : ''}`}>
                            <span className="w-2.5 h-2.5 rounded-full border border-current flex items-center justify-center text-[8px]">
                              {hasUppercase ? '✓' : '○'}
                            </span>
                            <span>One uppercase letter</span>
                          </div>
                          <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-600 font-medium' : ''}`}>
                            <span className="w-2.5 h-2.5 rounded-full border border-current flex items-center justify-center text-[8px]">
                              {hasNumber ? '✓' : '○'}
                            </span>
                            <span>One number</span>
                          </div>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                          CONFIRM PASSWORD *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Current Residence / Location */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            RESIDENCE / CITY
                          </label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Cebu, Philippines"
                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            CONTACT NUMBER
                          </label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+63 917 123 4567"
                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm"
                          />
                        </div>
                      </div>

                      {/* Headline (Optional) */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                          PROFESSIONAL HEADLINE (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="Associate Software Engineer @ Global Solutions"
                          className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm"
                        />
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="w-1/3 py-3.5 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                        >
                          BACK
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg transition-all cursor-pointer"
                        >
                          NEXT: REVIEW & PLEDGE
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* STEP 3: REVIEW APPLICATION & CECILIAN ALUMNI PLEDGE */}
                {step === 3 && (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-[#8B181B] mb-2 border border-red-200">
                      <ShieldCheck className="w-3 h-3" />
                      Step 3 of 3 • Final Verification
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-1">
                      Review & Honor Pledge
                    </h2>
                    <p className="text-sm text-stone-500 font-normal mb-5">
                      Verify your alumni credentials before submitting to St. Cecilia’s College alumni portal.
                    </p>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3 text-xs mb-5">
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Official Alumni ID</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#8B181B] text-sm">{previewAlumniId}</span>
                          <span className="text-[10px] text-stone-500 block font-mono">Academic Student ID: {studentId}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold block">
                            <Check className="w-3 h-3 text-emerald-600 inline" />
                            Official Registrar Screened
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Alumnus Name</span>
                        <span className="font-bold text-stone-900">{firstName} {lastName}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Degree & Batch</span>
                        <span className="font-semibold text-stone-800">{course} • Class of {batch}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Portal Email</span>
                        <span className="font-semibold text-stone-800">{regEmail}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Residence</span>
                        <span className="text-stone-800">{location || 'Cebu, Philippines'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Community Role</span>
                        <span className="font-bold uppercase text-[#8B181B] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Alumni Member
                        </span>
                      </div>
                    </div>

                    {/* DATA PRIVACY ACT & CONSENT SECTION */}
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl mb-4 text-xs">
                      <div className="flex items-center gap-2 mb-2 text-stone-900 font-bold">
                        <Shield className="w-4 h-4 text-[#8B181B]" />
                        <span>Data Privacy Act & Consent (RA 10173)</span>
                      </div>
                      <p className="text-stone-600 text-[11px] leading-relaxed mb-3">
                        In compliance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012), St. Cecilia’s College - Cebu, Inc. collects, stores, and securely processes your personal and educational information strictly for official institutional purposes, including:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3 text-[11px] text-stone-700">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                          <span>Alumni record management & verification</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                          <span>Official institutional communication</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                          <span>Events, reunions & campus activities</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                          <span>Graduate tracer studies (CHED reporting)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                          <span>Employment & professional tracking</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                          <span>School & alumni-related announcements</span>
                        </div>
                      </div>
                      <label className="flex items-start gap-2.5 pt-2 border-t border-stone-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreedToPrivacyConsent}
                          onChange={(e) => setAgreedToPrivacyConsent(e.target.checked)}
                          className="w-4 h-4 text-[#8B181B] rounded border-stone-300 mt-0.5 focus:ring-[#8B181B] accent-[#8B181B] cursor-pointer"
                        />
                        <span className="text-stone-800 font-semibold text-[11px] leading-relaxed">
                          I consent to the collection, storage, and processing of my personal and academic data for the stated institutional alumni purposes.
                        </span>
                      </label>
                    </div>

                    {/* ZERO DISCLOSURE / CONFIDENTIALITY AGREEMENT */}
                    <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl mb-4 text-xs">
                      <div className="flex items-center gap-2 mb-2 text-stone-900 font-bold">
                        <ShieldAlert className="w-4 h-4 text-amber-700" />
                        <span>Zero Disclosure / Confidentiality Agreement</span>
                      </div>
                      <p className="text-stone-700 text-[11px] leading-relaxed mb-2.5">
                        As a verified member of the Alumni Portal, you agree to treat all directory contacts, alumni profiles, and internal communications as confidential. You expressly pledge not to disclose, extract, sell, or distribute community information to third parties, commercial marketing entities, or automated web crawlers without written consent.
                      </p>
                      <label className="flex items-start gap-2.5 pt-2 border-t border-amber-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreedToZeroDisclosure}
                          onChange={(e) => setAgreedToZeroDisclosure(e.target.checked)}
                          className="w-4 h-4 text-[#8B181B] rounded border-stone-300 mt-0.5 focus:ring-[#8B181B] accent-[#8B181B] cursor-pointer"
                        />
                        <span className="text-stone-800 font-semibold text-[11px] leading-relaxed">
                          I agree to the Zero Disclosure and Confidentiality Agreement and pledge to protect the privacy of fellow Cecilians.
                        </span>
                      </label>
                    </div>

                    {/* Cecilian Alumni Honor Pledge Checkbox */}
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50/60 border border-red-200/80 rounded-xl mb-6">
                      <input
                        type="checkbox"
                        id="honorCode"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 text-[#8B181B] rounded border-stone-300 mt-0.5 focus:ring-[#8B181B] accent-[#8B181B] cursor-pointer"
                      />
                      <label htmlFor="honorCode" className="text-xs text-stone-700 leading-relaxed select-none cursor-pointer">
                        I solemnly affirm that I am an alumnus/graduate of <span className="font-bold text-stone-900">St. Cecilia’s College - Cebu, Inc.</span> I pledge to uphold the values of Excellence, Integrity, and Compassionate Service, and agree to the Alumni Portal terms of use.
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-1/3 py-3.5 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                      >
                        BACK
                      </button>
                      <button
                        type="button"
                        disabled={!agreedToTerms || !agreedToPrivacyConsent || !agreedToZeroDisclosure}
                        onClick={handleCompleteRegistration}
                        className={`flex-1 py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase shadow-md transition-all ${
                          agreedToTerms && agreedToPrivacyConsent && agreedToZeroDisclosure
                            ? 'bg-[#8B181B] hover:bg-[#721316] text-white cursor-pointer shadow-red-950/20 hover:shadow-lg'
                            : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        COMPLETE ALUMNI REGISTRATION
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            </>
          )}
          </div>
        )}
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        initialEmail={forgotEmail || (loginIdentifier.includes('@') ? loginIdentifier.trim() : '')}
        onClose={() => setShowForgotModal(false)}
        onSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
};

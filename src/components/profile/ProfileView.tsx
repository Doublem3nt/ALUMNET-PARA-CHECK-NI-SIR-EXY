import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Edit,
  Camera,
  Share2,
  CheckCircle2,
  Users,
  Building,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { EditProfileModal } from './EditProfileModal';
import { DigitalAlumniCard } from './DigitalAlumniCard';
import { RegistrarSelfVerificationModal } from './RegistrarSelfVerificationModal';

export const ProfileView: React.FC = () => {
  const { currentUser } = useAlumni();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegistrarModal, setShowRegistrarModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!currentUser) return null;

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Card Container */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-64 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900">
          <img
            src={currentUser.coverPhotoUrl}
            alt="Cover"
            className="w-full h-full object-cover opacity-90"
          />
          <button
            onClick={() => setShowEditModal(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Update Cover</span>
          </button>
        </div>

        {/* Profile Details & Avatar Header */}
        <div className="px-5 sm:px-8 pb-6">
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="relative">
              <img
                src={currentUser.profilePictureUrl}
                alt={currentUser.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-white shadow-lg bg-stone-100"
              />
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute bottom-2 right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-colors"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setShowRegistrarModal(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  currentUser.isVerified
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentUser.isVerified ? 'Registrar Verified' : 'Verify with Registrar'}</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('digital-id-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                <span>Digital ID Card</span>
              </button>

              <button
                onClick={handleShareProfile}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* User Bio Details */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-stone-900">{currentUser.name}</h1>
              {currentUser.isVerified && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  Verified Alum
                </span>
              )}
              <span className="uppercase text-[11px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {currentUser.role}
              </span>
            </div>

            <p className="text-sm sm:text-base font-medium text-stone-700 mt-1">
              {currentUser.headline}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs sm:text-sm text-stone-500 font-medium">
              <span className="flex items-center gap-1 text-blue-700 font-bold">
                <GraduationCap className="w-4 h-4" />
                Batch of {currentUser.batch} • {currentUser.course}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-stone-400" />
                {currentUser.location}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4 text-stone-400" />
                {currentUser.email}
              </span>
              {currentUser.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-stone-400" />
                  {currentUser.phone}
                </span>
              )}
            </div>

            {/* Unverified Alumni Guidance Callout */}
            {!currentUser.isVerified && currentUser.role === 'alumni' && (
              <div className="mt-4 p-3.5 sm:p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                      Official Degree Verification Required
                    </h3>
                    <p className="text-[11px] sm:text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                      Cross-reference your student ID with the Office of the Registrar to earn the Verified Alum credential, unlock private peer messaging, and validate your Digital Pass.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegistrarModal(true)}
                  className="px-3.5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Verify Now →
                </button>
              </div>
            )}
          </div>

          {/* Social Counts Bar */}
          <div className="mt-5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-3 text-center">
            <div>
              <span className="text-lg font-bold text-stone-900 block">
                {currentUser.connectionsCount || 0}
              </span>
              <span className="text-xs text-stone-500 font-medium">Alumni Network</span>
            </div>
            <div>
              <span className="text-lg font-bold text-stone-900 block font-mono">
                {currentUser.batch || '2024'}
              </span>
              <span className="text-xs text-stone-500 font-medium">Graduation Batch</span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#8B181B] block">
                {currentUser.isVerified ? 'Official Verified' : 'Portal Member'}
              </span>
              <span className="text-xs text-stone-500 font-medium">Cecilian Standing</span>
            </div>
          </div>

          {/* Official Alumni Digital Card (Banking App Style) */}
          <div id="digital-id-section" className="mt-8 p-6 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 rounded-2xl border border-stone-800 text-white shadow-xl scroll-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-stone-800">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                    Official Alumni Digital Pass (Banking Card)
                  </h2>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  Interactive metallic access card with EMV chip, contactless gate verification, and QR turnstile code.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  <CheckCircle2 className="w-3 h-3" />
                  ACTIVE MEMBERSHIP
                </span>
              </div>
            </div>

            <DigitalAlumniCard user={currentUser} />
          </div>

          {/* About Section */}
          <div className="mt-6">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
              About
            </h2>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line bg-stone-50/50 p-4 rounded-xl border border-stone-100">
              {currentUser.about || 'No bio written yet. Click "Edit Profile" to add your story.'}
            </p>
          </div>

          {/* Professional Experience Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Experience ({(currentUser.experience || []).length})</span>
              </h2>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Add / Edit
              </button>
            </div>

            <div className="space-y-3">
              {(currentUser.experience || []).length === 0 ? (
                <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-400">
                  No experience listed yet.
                </div>
              ) : (
                (currentUser.experience || []).map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-stone-900">{exp.title}</h3>
                      <span className="text-xs text-stone-400 font-medium">{exp.startDate}</span>
                    </div>
                    <div className="text-xs text-stone-600 font-semibold mt-0.5">
                      {exp.company} • <span className="text-stone-500">{exp.location}</span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-stone-600 mt-2 leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Education Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Education ({(currentUser.education || []).length})</span>
              </h2>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Add / Edit
              </button>
            </div>

            <div className="space-y-3">
              {(currentUser.education || []).length === 0 ? (
                <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-400">
                  No education listed yet.
                </div>
              ) : (
                (currentUser.education || []).map((edu) => (
                  <div
                    key={edu.id}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-stone-900">{edu.degree}</h3>
                      <span className="text-xs text-stone-400 font-medium">
                        {edu.startYear} - {edu.endYear}
                      </span>
                    </div>
                    <div className="text-xs text-stone-600 font-semibold mt-0.5">
                      {edu.institution} • {edu.fieldOfStudy}
                    </div>
                    {edu.honors && (
                      <div className="mt-1.5 text-xs text-blue-700 font-semibold">
                        Honors: {edu.honors}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />

      {/* Registrar Degree Self-Verification Modal */}
      <RegistrarSelfVerificationModal
        isOpen={showRegistrarModal}
        onClose={() => setShowRegistrarModal(false)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  GraduationCap,
  X
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';

interface FirstTimeProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INDUSTRIES = [
  'Information Technology & Software',
  'Education & Academic Research',
  'Healthcare, Medical & Nursing',
  'Engineering & Construction',
  'Banking, Finance & Insurance',
  'Business Process Outsourcing (BPO)',
  'Government & Public Administration',
  'Hospitality, Culinary & Tourism',
  'Media, Arts & Creative Design',
  'Manufacturing & Logistics',
  'Legal & Professional Services',
  'Non-Profit & Community Development',
  'Other Professional Field'
];

export const FirstTimeProfileSetupModal: React.FC<FirstTimeProfileSetupModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, updateProfile, showToast, addAuditLog } = useAlumni();

  if (!isOpen || !currentUser) return null;

  const [employmentStatus, setEmploymentStatus] = useState<
    'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired'
  >(currentUser.employmentStatus || 'Employed');
  const [currentPosition, setCurrentPosition] = useState(currentUser.currentPosition || '');
  const [company, setCompany] = useState(currentUser.company || '');
  const [industry, setIndustry] = useState(currentUser.industry || 'Information Technology & Software');
  const [workLocation, setWorkLocation] = useState(currentUser.location || 'Cebu, Philippines');
  const [headline, setHeadline] = useState(
    currentUser.headline || (currentUser.course ? `${currentUser.course} Graduate` : 'Cecilian Alumnus')
  );
  const [skillsInput, setSkillsInput] = useState(
    (currentUser.skills || ['Leadership', 'Problem Solving']).join(', ')
  );
  const [website, setWebsite] = useState(currentUser.website || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const generatedHeadline =
      currentPosition && company
        ? `${currentPosition} at ${company}`
        : headline || `${currentPosition || 'Professional'} • Class of ${currentUser.batch || '2024'}`;

    const updates = {
      employmentStatus,
      currentPosition: currentPosition.trim(),
      company: company.trim(),
      industry,
      location: workLocation.trim(),
      headline: generatedHeadline,
      skills: parsedSkills.length > 0 ? parsedSkills : ['Communication', 'Teamwork'],
      website: website.trim(),
      isProfileSetupCompleted: true
    };

    updateProfile(updates);

    addAuditLog({
      action: 'Initial Profile Setup Completed',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'alumni_registration',
      details: `Alumnus completed priority first-time profile setup. Company: "${company}", Title: "${currentPosition}", Industry: "${industry}".`,
      severity: 'success'
    });

    setIsSubmitting(false);
    showToast('Professional profile setup completed successfully!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#8B181B] to-[#5C0A0D] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Dismiss for now"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Priority First-Time Setup
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome, {currentUser.name}!
          </h2>
          <p className="text-xs text-white/80 mt-1 max-w-md leading-relaxed">
            Please complete your professional details. This data enables alumni career networking, mentor matching, and official graduate tracer records.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-stone-700 max-h-[75vh] overflow-y-auto">
          {/* Employment Status */}
          <div>
            <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
              Current Employment Status <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['Employed', 'Self-employed', 'Unemployed', 'Student', 'Retired'] as const).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setEmploymentStatus(st)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    employmentStatus === st
                      ? 'bg-[#8B181B] text-white border-[#8B181B] shadow-2xs'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {st === 'Unemployed' ? 'Seeking Opportunities' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Job Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
                Current Job Title / Position <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={currentPosition}
                  onChange={(e) => setCurrentPosition(e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
                Company / Organization <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Tech Innovations Corp."
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>
            </div>
          </div>

          {/* Industry & Work Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
                Industry Sector <span className="text-red-600">*</span>
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-medium focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
                Work Location / City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="Cebu City, Philippines or Remote"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>
            </div>
          </div>

          {/* Professional Headline */}
          <div>
            <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
              Professional Headline / Tagline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Lead Full Stack Engineer @ Acmeda | SCC Class of 2021"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
            />
          </div>

          {/* Key Skills */}
          <div>
            <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
              Key Skills & Specializations (Comma-separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g., React, TypeScript, Cloud Architecture, Project Management"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
            />
          </div>

          {/* Portfolio or LinkedIn Link */}
          <div>
            <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
              LinkedIn Profile or Portfolio URL (Optional)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B]"
              />
            </div>
          </div>

          {/* Confidentiality Reminder */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-start gap-2 text-[11px] text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Your professional data is safeguarded under the Philippine Data Privacy Act of 2012 and Institutional Zero Disclosure policy. You can update these details anytime in your Profile tab.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 transition-colors"
            >
              Skip For Now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#8B181B] hover:bg-[#721316] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SAVE & COMPLETE SETUP</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

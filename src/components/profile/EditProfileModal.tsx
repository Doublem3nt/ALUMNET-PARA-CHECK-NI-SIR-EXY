import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Camera,
  Upload,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { Experience, Education } from '../../types';

export const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, updateUserProfile } = useAlumni();

  if (!isOpen || !currentUser) return null;

  const [name, setName] = useState(currentUser.name);
  const [headline, setHeadline] = useState(currentUser.headline);
  const [about, setAbout] = useState(currentUser.about);
  const [location, setLocation] = useState(currentUser.location);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(currentUser.profilePictureUrl);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(currentUser.coverPhotoUrl);

  const [experience, setExperience] = useState<Experience[]>([...(currentUser.experience || [])]);
  const [education, setEducation] = useState<Education[]>([...(currentUser.education || [])]);

  // Handle adding experience
  const addExperience = () => {
    setExperience([
      ...experience,
      {
        id: 'exp_' + Date.now(),
        title: '',
        company: '',
        location: '',
        startDate: '',
        current: true,
        description: ''
      }
    ]);
  };

  const removeExperience = (id: string) => {
    setExperience(experience.filter((exp) => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperience(
      experience.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  // Handle adding education
  const addEducation = () => {
    setEducation([
      ...education,
      {
        id: 'edu_' + Date.now(),
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startYear: '',
        endYear: ''
      }
    ]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducation(
      education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      headline,
      about,
      location,
      phone,
      profilePictureUrl,
      coverPhotoUrl,
      experience,
      education
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">Edit Your Alumni Profile</h2>
            <p className="text-xs text-stone-500">Update your bio, photos, professional experience, and degrees</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-6 text-xs sm:text-sm">
          {/* Media Pickers (Simulating Cloudinary Upload) */}
          <div className="space-y-3">
            <h3 className="font-bold text-stone-900 uppercase tracking-wider text-xs">Profile Imagery</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">Cover Photo URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={coverPhotoUrl}
                  onChange={(e) => setCoverPhotoUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() =>
                    setCoverPhotoUrl('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80')
                  }
                  className="px-2.5 py-2 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg shrink-0 font-medium"
                >
                  Preset Campus
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">Avatar Picture URL</label>
              <div className="flex items-center gap-3">
                <img
                  src={profilePictureUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-full object-cover border border-stone-300"
                />
                <input
                  type="url"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Basic Details */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <h3 className="font-bold text-stone-900 uppercase tracking-wider text-xs">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Senior Engineering Lead at Acme Corp"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">About / Bio</label>
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Share your passions, university memories, or what you are working on..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Experience Section */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Professional Experience</span>
              </h3>
              <button
                type="button"
                onClick={addExperience}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            {experience.map((exp, idx) => (
              <div key={exp.id || idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 relative">
                <button
                  type="button"
                  onClick={() => removeExperience(exp.id)}
                  className="absolute top-2.5 right-2.5 text-stone-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2 pr-6">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block">Job Title</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                      placeholder="e.g. Director of Engineering"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      placeholder="e.g. Google"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block">Time Period</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      placeholder="2021 - Present"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block">Location</label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      placeholder="San Francisco, CA"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block">Description</label>
                  <textarea
                    rows={2}
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    placeholder="Key achievements and technologies..."
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Education Section */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Education & Degrees</span>
              </h3>
              <button
                type="button"
                onClick={addEducation}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Degree</span>
              </button>
            </div>

            {education.map((edu, idx) => (
              <div key={edu.id || idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 relative">
                <button
                  type="button"
                  onClick={() => removeEducation(edu.id)}
                  className="absolute top-2.5 right-2.5 text-stone-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2 pr-6">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      placeholder="B.S. Computer Science"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      placeholder="University Alumni Board"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block">Years</label>
                    <input
                      type="text"
                      value={`${edu.startYear} - ${edu.endYear}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        updateEducation(edu.id, 'startYear', parts[0]?.trim() || '');
                        updateEducation(edu.id, 'endYear', parts[1]?.trim() || '');
                      }}
                      placeholder="2016 - 2020"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block">Honors</label>
                    <input
                      type="text"
                      value={edu.honors || ''}
                      onChange={(e) => updateEducation(edu.id, 'honors', e.target.value)}
                      placeholder="Magna Cum Laude"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  HelpCircle,
  Shield,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  Lock,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';

export const HelpAndInfoSection: React.FC = () => {
  const { setActiveTab } = useAlumni();
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setActiveAccordion((prev) => (prev === id ? null : id));
  };

  const faqs = [
    {
      id: 'faq_verify',
      question: 'How do I verify my Cecilian Alumni Status?',
      answer:
        'All alumni accounts can be authenticated against official Registrar student masterlist records using your Academic Student ID and Graduation Batch. Once matched, an official gold verified badge and encrypted Cecilian Alumni ID are issued to your profile.'
    },
    {
      id: 'faq_events',
      question: 'How do Event RSVPs and Event Group Chats work?',
      answer:
        'When you RSVP "Going" to any campus or virtual alumni event, the portal automatically adds you to the dedicated Event Attendee Group Chat in your Messages tab. If you change your RSVP to "Not Going", you are cleanly unsubscribed.'
    },
    {
      id: 'faq_milestones',
      question: 'How can I share career milestones or campus gallery photos?',
      answer:
        'Go to the Milestones tab or use the quick action on your dashboard. You can upload multiple high-resolution photos with drag-and-drop, optionally tag batchmates, and your post will be published to the live campus community feed.'
    },
    {
      id: 'faq_security',
      question: 'How is my private data protected?',
      answer:
        'Your profile is guarded under Republic Act 10173 (Philippine Data Privacy Act) and our Zero Disclosure Policy. Your phone number and private contact records are never published publicly or shared with commercial marketers.'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden mt-6">
      {/* Header */}
      <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-[#8B181B] flex items-center justify-center font-bold shadow-2xs border border-red-200">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">Help & Information Center</h2>
            <p className="text-xs text-stone-500">System user guides, Data Privacy Act reminders, and support resources</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            <Shield className="w-3 h-3 text-[#8B181B]" />
            Official SCC Portal Support
          </span>
        </div>
      </div>

      {/* Grid Layout of 4 Pillars */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: FAQs & System Guides */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-900">
            <BookOpen className="w-4 h-4 text-[#8B181B]" />
            <span>Frequently Asked Questions</span>
          </div>

          <div className="space-y-2">
            {faqs.map((faq) => {
              const isOpen = activeAccordion === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/40 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-3 text-left flex items-center justify-between gap-2 hover:bg-stone-100/60 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-stone-800">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-3 pt-1 text-[11px] text-stone-600 leading-relaxed border-t border-stone-100 bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pillar 2: Data Privacy & Zero Disclosure Policy */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-900">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Data Privacy & Zero Disclosure</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2.5 text-xs text-stone-700">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900 block text-xs">Republic Act No. 10173 Compliance</span>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                  St. Cecilia’s College processes alumni information solely for official alumni management, institutional communication, CHED Graduate Tracer studies, and campus events. Your data is stored securely with strict role-based access control.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-amber-200/50">
              <Lock className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900 block text-xs">Zero Disclosure Policy</span>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                  All community members agree to zero unauthorized disclosure of peer alumni contact info, employment history, or student identifiers. Commercial marketing, automated scraping, or selling of member directories is strictly prohibited.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Support & Contact Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-900">
            <Phone className="w-4 h-4 text-[#8B181B]" />
            <span>Alumni Relations Office Contact</span>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5 text-xs text-stone-700">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#8B181B] shrink-0" />
              <div>
                <span className="font-semibold text-stone-900">Official Inquiries Email:</span>{' '}
                <a href="mailto:alumni@stcecilias.edu.ph" className="text-[#8B181B] hover:underline font-medium">
                  alumni@stcecilias.edu.ph
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#8B181B] shrink-0" />
              <div>
                <span className="font-semibold text-stone-900">Telephone / Trunkline:</span>{' '}
                <span className="text-stone-700 font-mono font-medium">+63 (032) 268-4746 / +63 917 123 4567</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#8B181B] shrink-0" />
              <div>
                <span className="font-semibold text-stone-900">Office Hours:</span>{' '}
                <span className="text-stone-600">Monday to Friday, 8:00 AM - 5:00 PM (PHT)</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <MapPin className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
              <div className="text-[11px] text-stone-600 leading-snug">
                <span className="font-semibold text-stone-900 block">Campus Office:</span>
                Alumni Relations & Career Placement Wing, 2nd Floor Administration Building, St. Cecilia’s College - Cebu, Inc., Poblacion Ward II, Minglanilla, Cebu, Philippines 6046
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 4: Helpful Links & Quick Resources */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-900">
            <FileText className="w-4 h-4 text-[#8B181B]" />
            <span>Helpful Alumni Resources</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className="p-3 rounded-xl border border-stone-200 hover:border-[#8B181B] bg-white hover:bg-red-50/30 transition-all text-left group"
            >
              <span className="font-bold text-stone-900 group-hover:text-[#8B181B] flex items-center justify-between">
                Digital Alumni ID
                <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#8B181B]" />
              </span>
              <span className="text-[11px] text-stone-500 mt-1 block">View and export official card with QR code</span>
            </button>

            <button
              onClick={() => setActiveTab('opportunities')}
              className="p-3 rounded-xl border border-stone-200 hover:border-[#8B181B] bg-white hover:bg-red-50/30 transition-all text-left group"
            >
              <span className="font-bold text-stone-900 group-hover:text-[#8B181B] flex items-center justify-between">
                Career Opportunities
                <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#8B181B]" />
              </span>
              <span className="text-[11px] text-stone-500 mt-1 block">Browse accredited company job postings</span>
            </button>

            <button
              onClick={() => setActiveTab('network')}
              className="p-3 rounded-xl border border-stone-200 hover:border-[#8B181B] bg-white hover:bg-red-50/30 transition-all text-left group"
            >
              <span className="font-bold text-stone-900 group-hover:text-[#8B181B] flex items-center justify-between">
                Alumni Directory
                <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#8B181B]" />
              </span>
              <span className="text-[11px] text-stone-500 mt-1 block">Search batchmates by batch and degree</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className="p-3 rounded-xl border border-stone-200 hover:border-[#8B181B] bg-white hover:bg-red-50/30 transition-all text-left group"
            >
              <span className="font-bold text-stone-900 group-hover:text-[#8B181B] flex items-center justify-between">
                Reunions & Events
                <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#8B181B]" />
              </span>
              <span className="text-[11px] text-stone-500 mt-1 block">Check calendar and upcoming webinars</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

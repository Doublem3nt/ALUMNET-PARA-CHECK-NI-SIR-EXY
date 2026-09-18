import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Briefcase,
  Megaphone,
  GraduationCap,
  Trophy,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { CampusGalleryModal } from '../gallery/CampusGalleryModal';

interface LandingPageProps {
  onNavigateToAuth: (mode: 'login' | 'register', role?: 'alumni' | 'employer') => void;
}

// 3 Slideshow images corresponding directly to the user's authentic uploaded campus photographs
const CAMPUS_SLIDES = [
  {
    id: 1,
    image: '/assets/landing-building-1.jpg',
    badge: 'SLIDE 01 • CAMPUS TOWER',
    title: 'St. Cecilia’s Modern Tower',
    caption: 'Towering academic high-rise architecture under the open sky.'
  },
  {
    id: 2,
    image: '/assets/landing-building-2.jpg',
    badge: 'SLIDE 02 • MAIN INSTITUTIONAL HALL',
    title: 'St. Cecilia’s College Main Building',
    caption: 'Official campus facade featuring the distinctive red column and main entrance canopy.'
  },
  {
    id: 3,
    image: '/assets/landing-building-3.jpg',
    badge: 'SLIDE 03 • CEBU CAMPUS COMPLEX',
    title: 'St. Cecilia’s Institutional Complex',
    caption: 'Academic grounds and collegiate learning facilities of St. Cecilia’s College - Cebu, Inc.'
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToAuth
}) => {
  const { currentUser } = useAlumni();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Slideshow state for background images 1 to 3
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHoveringControls, setIsHoveringControls] = useState(false);

  // Auto-advance slideshow every 6 seconds
  useEffect(() => {
    if (isHoveringControls) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % CAMPUS_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHoveringControls]);

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % CAMPUS_SLIDES.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + CAMPUS_SLIDES.length) % CAMPUS_SLIDES.length);
  };

  // Track scroll position for dynamic sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] text-[#111827] font-sans selection:bg-[#991B1B] selection:text-white">
      
      {/* ========================================================
          STICKY HEADER
          Matches Screenshots 1, 2, 3:
          Left: ALUMNI / ST. CECILIA'S
          Right: Home | Gallery | Sign In | Apply Now
          Seamlessly adapts between dark hero overlay and crisp white on scroll
          ======================================================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
          isScrolled
            ? 'bg-[#FFFFFF] border-b border-[#E5E7EB] shadow-xs py-3.5 sm:py-4'
            : 'bg-black/30 backdrop-blur-xs py-4 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          
          {/* Logo Brand: "ALUMNI" / "ST. CECILIA'S" with Team Seal */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 sm:gap-4 cursor-pointer select-none group"
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#991B1B] to-amber-500 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/assets/cecilians-seal.jpg"
                alt="Alumni Cecilian's Seal"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div className="flex flex-col">
              <span
                className="font-display tracking-[0.35em] text-[#991B1B] text-xl sm:text-2xl font-bold leading-none group-hover:opacity-90 transition-opacity"
                style={{ letterSpacing: '0.35em' }}
              >
                ALUMNI
              </span>
              <span
                className="text-[10px] sm:text-[11px] tracking-[0.25em] text-[#991B1B] font-bold uppercase mt-1"
                style={{ letterSpacing: '0.25em' }}
              >
                ST. CECILIA'S
              </span>
            </div>
          </div>

          {/* Nav items - Larger, more visible & prominent */}
          <nav className="flex items-center gap-4 sm:gap-8 text-sm sm:text-[15px] font-bold">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`transition-colors py-1 ${
                isScrolled ? 'text-[#111827] hover:text-[#991B1B]' : 'text-stone-200 hover:text-white'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => setShowGalleryModal(true)}
              className={`transition-colors py-1 ${
                isScrolled ? 'text-[#4B5563] hover:text-[#111827]' : 'text-stone-200 hover:text-white'
              }`}
            >
              Gallery
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => onNavigateToAuth('login')}
                className={`transition-colors py-1 text-xs sm:text-sm font-semibold ${
                  isScrolled ? 'text-[#4B5563] hover:text-[#111827]' : 'text-stone-200 hover:text-white'
                }`}
              >
                Sign In
              </button>

              <button
                onClick={() => onNavigateToAuth('register')}
                className="bg-[#991B1B] hover:bg-[#7f1616] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold tracking-wider text-xs sm:text-sm shadow-md transition-all hover:scale-102"
              >
                Register
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ========================================================
          HERO SECTION (Matches Screenshot 1)
          - Dark architectural building backdrop with 3-image slideshow (Image 1 to 3)
          - Top-left red corner decorative element
          - "• EST. 2026 • ST. CECILIA'S" badge with team seal
          - "Where / Legacy / Lives On." (Legacy italic)
          - Left red accent bar with subtext
          - "APPLY NOW" and "SIGN IN" buttons
          - Right vertical text: "ALUMNI • ST. CECILIA'S • 2026"
          - Bottom pagination indicators & slide switcher
          ======================================================== */}
      <section className="relative min-h-screen flex items-center bg-[#111827] text-white overflow-hidden pt-20">
        
        {/* Slideshow Architecture Backdrop: Images 1 to 3 */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {CAMPUS_SLIDES.map((slide, index) => {
            const isActive = index === currentSlideIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover filter contrast-110 brightness-80 transition-transform duration-7000 ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                />
              </div>
            );
          })}
          {/* Gradients for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/50 pointer-events-none" />
        </div>

        {/* Decorative corner red bracket on the top-left (visible in Screenshot 1) */}
        <div className="absolute left-8 sm:left-12 top-28 z-10 w-10 h-10 border-t border-l border-[#991B1B]/70 pointer-events-none" />

        {/* Vertical tracking text along right edge (from Screenshot 1) */}
        <div className="hidden lg:flex absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 z-10 select-none pointer-events-none">
          <span
            className="text-[10px] font-semibold text-white/30 tracking-[0.4em] uppercase"
            style={{ writingMode: 'vertical-rl' }}
          >
            ALUMNI • ST. CECILIA'S • 2026
          </span>
        </div>

        {/* Slideshow Prev & Next Floating Arrow Controls */}
        <div
          className="absolute inset-y-0 left-3 sm:left-6 z-20 flex items-center"
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
        >
          <button
            type="button"
            onClick={goToPrevSlide}
            aria-label="Previous Slide"
            className="p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-[#991B1B]/80 text-white/70 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all shadow-lg cursor-pointer hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div
          className="absolute inset-y-0 right-3 sm:right-6 z-20 flex items-center"
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
        >
          <button
            type="button"
            onClick={goToNextSlide}
            aria-label="Next Slide"
            className="p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-[#991B1B]/80 text-white/70 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all shadow-lg cursor-pointer hover:scale-110"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            
            {/* Top Red Badge with Team Seal & Current Slide Badge */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#991B1B]/50 bg-[#991B1B]/25 text-[#fca5a5] text-xs font-bold tracking-wider uppercase backdrop-blur-xs">
                <img
                  src="/assets/cecilians-seal.jpg"
                  alt="Alumni Cecilian's Seal"
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>• EST. 2026 • ST. CECILIA'S ALUMNI</span>
              </div>

              {/* Active Slide Tracker Chip */}
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-black/30 backdrop-blur-md text-[11px] font-semibold text-stone-300">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                <span>{CAMPUS_SLIDES[currentSlideIndex].badge}</span>
              </div>
            </div>

            {/* Giant Cormorant Garamond Display Headline */}
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-normal text-white leading-[1.05] tracking-tight mb-8">
              Where<br />
              <span className="italic font-normal">Legacy</span><br />
              Lives On.
            </h1>

            {/* Subtext with red accent mark on left & current slide title */}
            <div className="flex items-start gap-4 max-w-xl mb-10">
              <span className="w-6 h-[2px] bg-[#991B1B] mt-2.5 shrink-0" />
              <div>
                <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-light">
                  A private network for St. Cecilia's graduates. Connect with fellow alumni, attend exclusive events, and carry your legacy forward.
                </p>
                <p className="text-xs text-red-300/80 font-medium mt-1.5 italic">
                  Featured: {CAMPUS_SLIDES[currentSlideIndex].title} — {CAMPUS_SLIDES[currentSlideIndex].caption}
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigateToAuth('register')}
                className="bg-[#991B1B] hover:bg-[#7f1616] text-white px-8 py-3.5 rounded-xs font-semibold text-xs tracking-[0.18em] uppercase shadow-lg transition-all"
              >
                APPLY NOW
              </button>

              <button
                onClick={() => onNavigateToAuth('login')}
                className="bg-transparent hover:bg-white/10 text-white border border-white/30 hover:border-white px-8 py-3.5 rounded-xs font-semibold text-xs tracking-[0.18em] uppercase transition-all"
              >
                SIGN IN
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Interactive Slideshow Pagination (1, 2, 3) */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15"
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
        >
          {CAMPUS_SLIDES.map((slide, idx) => {
            const isSelected = idx === currentSlideIndex;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#991B1B] text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>0{slide.id}</span>
                <span className="hidden sm:inline text-[11px] font-medium opacity-90">
                  {idx === 0 ? 'Tower' : idx === 1 ? 'Main Hall' : 'Campus'}
                </span>
                <span
                  className={`h-1 rounded-full transition-all duration-300 ${
                    isSelected ? 'w-6 bg-white' : 'w-2 bg-white/30'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          STATS BAND (Matches Screenshot 2)
          Brand Red #991B1B Background, 4 columns:
          500+ GRADUATES | 12 ACTIVE CHAPTERS | 48+ ANNUAL EVENTS | 25+ YEARS OF LEGACY
          ======================================================== */}
      <section className="bg-[#991B1B] text-white border-y border-[#7f1616]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/20 py-8 sm:py-10">
            
            {/* Stat 1 */}
            <div className="text-center py-4 md:py-2 px-4">
              <div className="font-display text-4xl sm:text-5xl font-light tracking-tight text-white mb-1">
                500+
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                GRADUATES
              </div>
            </div>

            {/* Stat 2 */}
            <div className="text-center py-4 md:py-2 px-4">
              <div className="font-display text-4xl sm:text-5xl font-light tracking-tight text-white mb-1">
                12
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                ACTIVE CHAPTERS
              </div>
            </div>

            {/* Stat 3 */}
            <div className="text-center py-4 md:py-2 px-4">
              <div className="font-display text-4xl sm:text-5xl font-light tracking-tight text-white mb-1">
                48+
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                ANNUAL EVENTS
              </div>
            </div>

            {/* Stat 4 */}
            <div className="text-center py-4 md:py-2 px-4">
              <div className="font-display text-4xl sm:text-5xl font-light tracking-tight text-white mb-1">
                25+
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                YEARS OF LEGACY
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          ABOUT SECTION (Matches Screenshot 2)
          — ABOUT
          A Network Built on Tradition.
          Right side: Two paragraphs + JOIN THE NETWORK →
          ======================================================== */}
      <section id="about" className="py-24 sm:py-32 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          {/* Red Label */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-5 h-[1.5px] bg-[#991B1B]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#991B1B]">
              ABOUT
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Headline */}
            <div className="lg:col-span-6">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#111827] font-normal leading-[1.15] tracking-tight">
                A Network<br />
                Built on<br />
                Tradition.
              </h2>
            </div>

            {/* Right Narrative */}
            <div className="lg:col-span-6 space-y-6 pt-2">
              <p className="text-[#6B7280] text-sm sm:text-base leading-relaxed font-light">
                The St. Cecilia's Alumni Network is an exclusive community connecting graduates across generations. We preserve the legacy of our institution while empowering alumni to grow professionally and personally.
              </p>

              <p className="text-[#6B7280] text-sm sm:text-base leading-relaxed font-light">
                From batch reunions to career mentorship, our platform is the bridge between where you came from and where you're going.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateToAuth('register')}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#991B1B] hover:text-[#7f1616] transition-colors group"
                >
                  <span>JOIN THE NETWORK</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          FEATURES SECTION (Matches Screenshots 3 & 4)
          — FEATURES
          Everything You Need, In One Place.
          Right side: GET ACCESS button
          6-Card Bento Grid with hairline borders:
          1. Alumni Network
          2. Exclusive Events
          3. Career Board
          4. Announcements
          5. Batch Chapters
          6. Career Milestones
          ======================================================== */}
      <section id="features" className="py-24 bg-[#FFFFFF] border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              {/* Red Label */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-[1.5px] bg-[#991B1B]" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#991B1B]">
                  FEATURES
                </span>
              </div>

              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#111827] font-normal leading-[1.1] tracking-tight">
                Everything You<br />
                Need, In One<br />
                Place.
              </h2>
            </div>

            {/* GET ACCESS button from Screenshot 3 & 4 */}
            <div>
              <button
                onClick={() => onNavigateToAuth('register')}
                className="border border-[#991B1B] text-[#991B1B] hover:bg-[#991B1B] hover:text-white px-7 py-3 rounded-xs text-xs font-bold uppercase tracking-[0.2em] transition-all"
              >
                GET ACCESS
              </button>
            </div>
          </div>

          {/* 6-Grid Feature Cards (3 columns x 2 rows) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-[#E5E7EB] bg-[#FFFFFF] divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB]">
            
            {/* Card 1: Alumni Network */}
            <div className="p-8 sm:p-10 flex flex-col justify-between hover:bg-[#F9FAFB] transition-colors">
              <div>
                <div className="mb-6 text-[#991B1B]">
                  <Users className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] mb-2.5">
                  Alumni Network
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Connect with thousands of St. Cecilia's graduates across all generations and industries.
                </p>
              </div>
            </div>

            {/* Card 2: Exclusive Events */}
            <div className="p-8 sm:p-10 flex flex-col justify-between hover:bg-[#F9FAFB] transition-colors border-t md:border-t-0">
              <div>
                <div className="mb-6 text-[#991B1B]">
                  <Calendar className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] mb-2.5">
                  Exclusive Events
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Access members-only reunions, homecomings, and career networking gatherings.
                </p>
              </div>
            </div>

            {/* Card 3: Career Board */}
            <div className="p-8 sm:p-10 flex flex-col justify-between hover:bg-[#F9FAFB] transition-colors border-t lg:border-t-0">
              <div>
                <div className="mb-6 text-[#991B1B]">
                  <Briefcase className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] mb-2.5">
                  Career Board
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Discover and share career opportunities within the St. Cecilia's community.
                </p>
              </div>
            </div>

            {/* Card 4: Announcements */}
            <div className="p-8 sm:p-10 flex flex-col justify-between hover:bg-[#F9FAFB] transition-colors border-t border-[#E5E7EB]">
              <div>
                <div className="mb-6 text-[#991B1B]">
                  <Megaphone className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] mb-2.5">
                  Announcements
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Stay informed with important institutional news and community announcements.
                </p>
              </div>
            </div>

            {/* Card 5: Batch Chapters */}
            <div className="p-8 sm:p-10 flex flex-col justify-between hover:bg-[#F9FAFB] transition-colors border-t border-[#E5E7EB]">
              <div>
                <div className="mb-6 text-[#991B1B]">
                  <GraduationCap className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] mb-2.5">
                  Batch Chapters
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Stay connected with your batch and program through dedicated chapter groups.
                </p>
              </div>
            </div>

            {/* Card 6: Career Milestones */}
            <div className="p-8 sm:p-10 flex flex-col justify-between hover:bg-[#F9FAFB] transition-colors border-t border-[#E5E7EB]">
              <div>
                <div className="mb-6 text-[#991B1B]">
                  <Trophy className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-[#111827] mb-2.5">
                  Career Milestones
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Celebrate achievements and share your professional journey with the community.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          CALL TO ACTION FOOTER BANNER
          ======================================================== */}
      <section className="py-20 bg-[#111827] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center relative z-10">
          <div className="w-12 h-12 rounded-sm bg-[#991B1B] mx-auto flex items-center justify-center text-white mb-6">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-normal text-white mb-4">
            Carry the Cecilian Spirit Forward
          </h2>
          <p className="text-stone-300 text-sm max-w-xl mx-auto mb-8 font-light leading-relaxed">
            Rejoin the alumni directory, connect with fellow graduates worldwide, and contribute to St. Cecilia's continuing heritage of excellence.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={() => onNavigateToAuth('register')}
              className="bg-[#991B1B] hover:bg-[#7f1616] text-white px-8 py-3.5 rounded-xs font-semibold text-xs tracking-[0.18em] uppercase shadow-lg transition-all"
            >
              REGISTER ACCOUNT
            </button>
            <button
              onClick={() => onNavigateToAuth('login')}
              className="bg-transparent hover:bg-white/10 text-white border border-white/30 hover:border-white px-8 py-3.5 rounded-xs font-semibold text-xs tracking-[0.18em] uppercase transition-all"
            >
              SIGN IN
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          INSTITUTIONAL FOOTER
          ======================================================== */}
      <footer className="bg-[#FFFFFF] border-t border-[#E5E7EB] py-12 text-[#6B7280] text-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-display tracking-[0.35em] text-[#991B1B] text-lg font-normal">
                ALUMNI
              </span>
              <span className="text-[9px] tracking-[0.25em] text-[#991B1B] font-semibold uppercase -mt-0.5">
                ST. CECILIA'S
              </span>
              <p className="text-[11px] text-[#6B7280] mt-2">
                Official Institutional Alumni Network & Directory
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-[#6B7280]">
              <button onClick={() => setShowGalleryModal(true)} className="hover:text-[#111827] cursor-pointer">
                Campus Gallery
              </button>
              <span>•</span>
              <button onClick={() => onNavigateToAuth('register', 'alumni')} className="hover:text-[#991B1B] cursor-pointer">
                Alumni Registration
              </button>
              <span>•</span>
              <button onClick={() => onNavigateToAuth('register', 'employer')} className="hover:text-[#991B1B] font-medium cursor-pointer">
                Employer Registration
              </button>
              <span>•</span>
              <button onClick={() => onNavigateToAuth('login')} className="hover:text-[#111827] cursor-pointer">
                Sign In
              </button>
              <span>•</span>
              <a href="#features" className="hover:text-[#111827]">
                Community Guidelines
              </a>
            </div>

            <div className="text-[11px] text-stone-400">
              © {new Date().getFullYear()} St. Cecilia's College. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================
          CAMPUS & HERITAGE GALLERY MODAL (Supports Admin & Registrar Upload)
          ======================================================== */}
      <CampusGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
      />

    </div>
  );
};

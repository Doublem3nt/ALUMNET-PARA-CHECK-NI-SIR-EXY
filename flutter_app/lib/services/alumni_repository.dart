import 'package:flutter/foundation.dart';
import '../models/models.dart';

class AlumniRepository extends ChangeNotifier {
  UserModel? _currentUser;
  final List<UserModel> _users = [];
  final List<OpportunityModel> _opportunities = [];
  final List<EventModel> _events = [];
  final List<ChapterModel> _chapters = [];
  final List<MilestoneModel> _milestones = [];
  final List<GalleryItemModel> _galleryItems = [];

  AlumniRepository() {
    _initData();
  }

  UserModel? get currentUser => _currentUser;
  List<UserModel> get users => List.unmodifiable(_users);
  List<OpportunityModel> get opportunities => List.unmodifiable(_opportunities);
  List<EventModel> get events => List.unmodifiable(_events);
  List<ChapterModel> get chapters => List.unmodifiable(_chapters);
  List<MilestoneModel> get milestones => List.unmodifiable(_milestones);
  List<GalleryItemModel> get galleryItems => List.unmodifiable(_galleryItems);

  bool get isLoggedIn => _currentUser != null;

  void _initData() {
    // Seed Sample Users
    _users.addAll([
      UserModel(
        uid: 'user-alumni-1',
        name: 'Maria Elena Santos',
        email: 'maria.santos@techsolutions.com',
        role: UserRole.alumni,
        batch: '2020',
        course: 'BS Information Technology',
        currentPosition: 'Senior Software Engineer',
        company: 'Apex Cloud Systems',
        location: 'Cebu City, Philippines',
        bio: 'Passionate full-stack developer and alumni mentor proud of my Cecilian roots.',
        skills: ['Flutter', 'React', 'Cloud Architecture', 'TypeScript'],
        isVerified: true,
      ),
      UserModel(
        uid: 'user-student-1',
        name: 'Joshua David Ramos',
        email: 'joshua.ramos@stcecilia.edu',
        role: UserRole.student,
        batch: '2025',
        course: 'BS Computer Science',
        location: 'Minglanilla, Cebu',
        bio: 'Senior student aspiring to become an AI & Mobile application engineer.',
        skills: ['Dart', 'Python', 'Machine Learning'],
        isVerified: true,
      ),
      UserModel(
        uid: 'user-faculty-1',
        name: 'Dr. Fernando Gomez, PhD',
        email: 'fernando.gomez@stcecilia.edu',
        role: UserRole.faculty,
        department: 'College of Information and Communications Technology',
        currentPosition: 'Associate Professor & Research Chair',
        location: 'Minglanilla, Cebu',
        bio: 'Guiding generations of Cecilian computer scientists and tech innovators.',
        skills: ['Software Engineering', 'Research', 'Curriculum Design'],
        isVerified: true,
      ),
      UserModel(
        uid: 'user-admin-1',
        name: 'Hon. Cecilia Carreon-Velasco',
        email: 'alumni.director@stcecilia.edu',
        role: UserRole.admin,
        currentPosition: 'Director of Alumni Relations',
        department: 'Alumni Affairs & Institutional Advancement',
        location: 'Minglanilla, Cebu',
        bio: 'Connecting over 25,000 alumni worldwide and fostering institutional legacy.',
        skills: ['Institutional Leadership', 'Fundraising', 'Community Organizing'],
        isVerified: true,
      ),
      UserModel(
        uid: 'user-superadmin-1',
        name: 'System Super Administrator',
        email: 'superadmin@stcecilia.edu',
        role: UserRole.superadmin,
        currentPosition: 'Chief Information Officer',
        location: 'Minglanilla, Cebu',
        bio: 'Institutional IT governance and security oversight.',
        skills: ['Enterprise Systems', 'Cybersecurity', 'Database Administration'],
        isVerified: true,
      ),
    ]);

    // Current user starts as Alumni (or can switch roles directly)
    _currentUser = _users[0];

    // Seed Opportunities
    _opportunities.addAll([
      OpportunityModel(
        id: 'opp-1',
        title: 'Junior Mobile Application Developer (Flutter / iOS)',
        company: 'Apex Cloud Systems',
        location: 'Cebu City / Hybrid',
        type: 'full-time',
        description: 'Building next-generation mobile applications for global fintech clients. Open to Cecilian graduates with strong Dart/Flutter skills.',
        salaryOrStipend: '₱35,000 - ₱55,000 / mo',
        skills: ['Flutter', 'Dart', 'REST APIs', 'Git'],
        contactEmail: 'maria.santos@techsolutions.com',
        postedByUid: 'user-alumni-1',
        postedByName: 'Maria Elena Santos',
        postedDate: DateTime.now().subtract(const Duration(days: 2)),
      ),
      OpportunityModel(
        id: 'opp-2',
        title: 'Alumni Tech Industry Mentorship Program',
        company: 'Cecilian Tech Founders Circle',
        location: 'Virtual / Remote',
        type: 'mentorship',
        description: 'Get paired 1-on-1 with industry veterans for resume reviews, mock interviews, and career guidance.',
        salaryOrStipend: 'Pro-Bono Mentorship',
        skills: ['Career Guidance', 'Mock Interviews', 'Portfolio Review'],
        contactEmail: 'alumni.director@stcecilia.edu',
        postedByUid: 'user-admin-1',
        postedByName: 'Hon. Cecilia Carreon-Velasco',
        postedDate: DateTime.now().subtract(const Duration(days: 5)),
      ),
      OpportunityModel(
        id: 'opp-3',
        title: 'Software Quality Assurance Intern',
        company: 'Visayas Digital Labs',
        location: 'Minglanilla / On-site',
        type: 'internship',
        description: 'Exciting paid internship opportunity for graduating students to learn automated and manual testing.',
        salaryOrStipend: '₱12,000 allowance',
        skills: ['Testing', 'Documentation', 'Attention to Detail'],
        contactEmail: 'careers@visayasdigitallabs.com',
        postedByUid: 'user-alumni-1',
        postedByName: 'Maria Elena Santos',
        postedDate: DateTime.now().subtract(const Duration(days: 7)),
      ),
    ]);

    // Seed Events
    _events.addAll([
      EventModel(
        id: 'evt-1',
        title: 'Grand Annual Alumni Homecoming 2026',
        description: 'Celebrate our shared Cecilian heritage, reunite with classmates, and honor jubilarian batches at the Main Quadrangle.',
        startDate: DateTime.now().add(const Duration(days: 24)),
        location: 'St. Cecilia’s College Main Quadrangle & Auditorium',
        category: 'Homecoming',
        rsvpCount: 428,
        isOnline: false,
      ),
      EventModel(
        id: 'evt-2',
        title: 'Global Cecilian Tech & Innovation Summit',
        description: 'Virtual keynote panels featuring Cecilian alumni founders across North America, Singapore, and Europe.',
        startDate: DateTime.now().add(const Duration(days: 12)),
        location: 'Virtual Broadcast (Zoom & Livestream)',
        category: 'Professional',
        rsvpCount: 195,
        isOnline: true,
      ),
      EventModel(
        id: 'evt-3',
        title: 'Alumni Charity Run & Campus Tree Planting',
        description: 'Annual scholarship fundraiser run through Minglanilla followed by campus arbor preservation.',
        startDate: DateTime.now().add(const Duration(days: 35)),
        location: 'Minglanilla Sports Complex & SCC Grounds',
        category: 'Community',
        rsvpCount: 310,
        isOnline: false,
      ),
    ]);

    // Seed Chapters
    _chapters.addAll([
      ChapterModel(
        id: 'ch-1',
        name: 'Metro Cebu Central Chapter',
        region: 'Central Visayas, Philippines',
        president: 'Engr. Roberto Mendoza',
        memberCount: 1840,
        contactEmail: 'cebu.chapter@stcecilia.edu',
      ),
      ChapterModel(
        id: 'ch-2',
        name: 'North America Cecilians Alliance',
        region: 'California, United States',
        president: 'Dr. Clarissa Uy-Tan',
        memberCount: 650,
        contactEmail: 'northamerica@stcecilia.edu',
      ),
      ChapterModel(
        id: 'ch-3',
        name: 'Middle East & Gulf Chapter',
        region: 'Dubai, UAE',
        president: 'Architect Noel Santos',
        memberCount: 420,
        contactEmail: 'middleeast@stcecilia.edu',
      ),
    ]);

    // Seed Milestones
    _milestones.addAll([
      MilestoneModel(
        id: 'ms-1',
        alumnusName: 'Justice Rafael Alvarez',
        batch: 'Class of 1998',
        awardTitle: 'Distinguished Cecilian Jurist Award',
        citation: 'For exemplary service in judicial integrity and constitutional governance.',
        year: '2025',
      ),
      MilestoneModel(
        id: 'ms-2',
        alumnusName: 'Engr. Katrina Yap',
        batch: 'Class of 2012',
        awardTitle: 'Global Engineering Pioneer',
        citation: 'Leading high-capacity renewable solar infrastructure across Southeast Asia.',
        year: '2024',
      ),
    ]);

    // Seed Campus Heritage Gallery
    _galleryItems.addAll([
      GalleryItemModel(
        id: 'gal-1',
        title: 'Main Academic Pavilion & St. Cecilia’s Quadrangle',
        category: 'Campus & Facilities',
        year: '2026',
        imageUrl: 'assets/landing-building-1.jpg',
        description: 'The historic academic heart of St. Cecilia’s College, Minglanilla, Cebu.',
      ),
      GalleryItemModel(
        id: 'gal-2',
        title: 'Centennial Heritage Arbor & Campus Grounds',
        category: 'Campus & Facilities',
        year: '2026',
        imageUrl: 'assets/landing-building-2.jpg',
        description: 'Shaded walkways connecting the collegiate libraries and laboratories.',
      ),
      GalleryItemModel(
        id: 'gal-3',
        title: 'Collegiate Façade & Main Entrance Gates',
        category: 'Campus & Facilities',
        year: '2026',
        imageUrl: 'assets/landing-building-3.jpg',
        description: 'Welcoming Cecilians and future leaders for decades.',
      ),
    ]);
  }

  // Switch role for live multi-role testing
  void switchRole(UserRole role) {
    final matchedUser = _users.firstWhere(
      (u) => u.role == role,
      orElse: () => _users[0],
    );
    _currentUser = matchedUser;
    notifyListeners();
  }

  void loginAs(UserModel user) {
    _currentUser = user;
    notifyListeners();
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }

  void addOpportunity(OpportunityModel opp) {
    _opportunities.insert(0, opp);
    notifyListeners();
  }

  void addMilestone(MilestoneModel milestone) {
    _milestones.insert(0, milestone);
    notifyListeners();
  }

  void addChapter(ChapterModel chapter) {
    _chapters.add(chapter);
    notifyListeners();
  }

  void addGalleryItem(GalleryItemModel item) {
    _galleryItems.insert(0, item);
    notifyListeners();
  }

  void toggleUserVerification(String uid) {
    final index = _users.indexWhere((u) => u.uid == uid);
    if (index != -1) {
      final user = _users[index];
      _users[index] = user.copyWith(isVerified: !user.isVerified);
      if (_currentUser?.uid == uid) {
        _currentUser = _users[index];
      }
      notifyListeners();
    }
  }
}

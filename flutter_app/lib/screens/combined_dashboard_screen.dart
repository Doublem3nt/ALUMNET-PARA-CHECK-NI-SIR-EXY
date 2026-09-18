import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/models.dart';
import '../services/alumni_repository.dart';

class CombinedDashboardScreen extends StatefulWidget {
  const CombinedDashboardScreen({super.key});

  @override
  State<CombinedDashboardScreen> createState() => _CombinedDashboardScreenState();
}

class _CombinedDashboardScreenState extends State<CombinedDashboardScreen> {
  // Admin internal tab state
  int _adminSelectedTab = 0; // 0: Members, 1: Metrics, 2: Milestones, 3: Chapters, 4: Gallery

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<AlumniRepository>();
    final user = repo.currentUser;
    final currentRole = user?.role ?? UserRole.alumni;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.asset(
                'assets/cecilians-seal.jpg',
                width: 34,
                height: 34,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  width: 34,
                  height: 34,
                  decoration: const BoxDecoration(
                    color: Color(0xFF991B1B),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text('SCC', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "St. Cecilia's College",
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF111827),
                    ),
                  ),
                  Text(
                    'Global Alumni Portal • ${currentRole.displayName}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Role switcher selector in AppBar
          PopupMenuButton<UserRole>(
            tooltip: 'Switch Dashboard Role',
            icon: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF991B1B).withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF991B1B).withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.swap_horiz, size: 16, color: Color(0xFF991B1B)),
                  const SizedBox(width: 4),
                  Text(
                    currentRole.shortName,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF991B1B),
                    ),
                  ),
                ],
              ),
            ),
            onSelected: (role) {
              repo.switchRole(role);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Switched to ${role.displayName} Dashboard'),
                  duration: const Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            itemBuilder: (context) => UserRole.values.map((r) {
              return PopupMenuItem<UserRole>(
                value: r,
                child: Row(
                  children: [
                    Icon(
                      _getRoleIcon(r),
                      size: 16,
                      color: r == currentRole ? const Color(0xFF991B1B) : Colors.grey[700],
                    ),
                    const SizedBox(width: 10),
                    Text(
                      r.displayName,
                      style: TextStyle(
                        fontWeight: r == currentRole ? FontWeight.bold : FontWeight.normal,
                        color: r == currentRole ? const Color(0xFF991B1B) : Colors.black,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Role Switcher Quick Bar
            _buildRoleSwitcherBar(repo, currentRole),
            const SizedBox(height: 16),

            // COMBINED ROLE-SPECIFIC DASHBOARDS
            if (currentRole == UserRole.alumni) ...[
              _buildAlumniDashboard(context, repo, user!),
            ] else if (currentRole == UserRole.student) ...[
              _buildStudentDashboard(context, repo, user!),
            ] else if (currentRole == UserRole.faculty) ...[
              _buildFacultyDashboard(context, repo, user!),
            ] else if (currentRole == UserRole.admin || currentRole == UserRole.staff) ...[
              _buildAdminStaffDashboard(context, repo, user!),
            ] else if (currentRole == UserRole.superadmin) ...[
              _buildSuperAdminDashboard(context, repo, user!),
            ],
          ],
        ),
      ),
    );
  }

  IconData _getRoleIcon(UserRole role) {
    switch (role) {
      case UserRole.alumni:
        return Icons.school_outlined;
      case UserRole.student:
        return Icons.person_outline;
      case UserRole.faculty:
        return Icons.menu_book_outlined;
      case UserRole.admin:
        return Icons.admin_panel_settings_outlined;
      case UserRole.staff:
        return Icons.badge_outlined;
      case UserRole.superadmin:
        return Icons.security_outlined;
    }
  }

  // Quick horizontal role switcher pills
  Widget _buildRoleSwitcherBar(AlumniRepository repo, UserRole activeRole) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: UserRole.values.map((role) {
            final isSelected = role == activeRole;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: ChoiceChip(
                label: Text(
                  role.shortName,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.white : const Color(0xFF4B5563),
                  ),
                ),
                selected: isSelected,
                selectedColor: const Color(0xFF991B1B),
                backgroundColor: const Color(0xFFF3F4F6),
                showCheckmark: false,
                onSelected: (selected) {
                  if (selected) repo.switchRole(role);
                },
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  // 1. ALUMNI ROLE DASHBOARD
  Widget _buildAlumniDashboard(BuildContext context, AlumniRepository repo, UserModel user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Welcome Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF991B1B), Color(0xFF7F1D1D), Color(0xFF1E293B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF991B1B).withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome, color: Color(0xFFFCD34D), size: 14),
                    SizedBox(width: 6),
                    Text(
                      'Cecilian Alumni Network',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Welcome back, ${user.name}!',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${user.course ?? "Cecilian Alumnus"} • Batch of ${user.batch ?? "All Years"}',
                style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 14, color: Color(0xFFFCD34D)),
                  const SizedBox(width: 4),
                  Text(
                    user.location ?? 'Cebu, Philippines',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Statistics Grid
        Row(
          children: [
            Expanded(child: _buildStatCard('Total Alumni', '${repo.users.length * 450}+', Icons.groups, Colors.blue)),
            const SizedBox(width: 10),
            Expanded(child: _buildStatCard('Active Chapters', '${repo.chapters.length}', Icons.public, const Color(0xFF10B981))),
            const SizedBox(width: 10),
            Expanded(child: _buildStatCard('Open Careers', '${repo.opportunities.length}', Icons.work, Colors.amber)),
          ],
        ),
        const SizedBox(height: 20),

        // Upcoming Alumni Reunions Section
        _buildSectionHeader('Upcoming Alumni Reunions & Events', () {}),
        const SizedBox(height: 10),
        ...repo.events.take(2).map((e) => _buildEventCard(e)),

        const SizedBox(height: 20),
        // Curated Opportunities Section
        _buildSectionHeader('Career Opportunities & Mentorship', () {}),
        const SizedBox(height: 10),
        ...repo.opportunities.take(2).map((opp) => _buildOpportunityCard(opp)),
      ],
    );
  }

  // 2. STUDENT ROLE DASHBOARD
  Widget _buildStudentDashboard(BuildContext context, AlumniRepository repo, UserModel user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Student Header Banner
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E3A8A), Color(0xFF2563EB), Color(0xFF3B82F6)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Student Career & Mentorship Portal',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Welcome, ${user.name}!',
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                'Class of ${user.batch ?? "2025"} • Candidate for Graduation',
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 12),
              const Text(
                'Connect with verified alumni leaders in your field for 1-on-1 career guidance, mock interviews, and direct internship opportunities.',
                style: TextStyle(color: Colors.white, fontSize: 12, height: 1.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Quick Student Tools
        Row(
          children: [
            Expanded(child: _buildActionTile('Find Alumni Mentor', Icons.people_outline, Colors.blue)),
            const SizedBox(width: 10),
            Expanded(child: _buildActionTile('Internship Listings', Icons.business_center_outlined, Colors.purple)),
          ],
        ),
        const SizedBox(height: 20),

        _buildSectionHeader('Recommended Internships & Programs', () {}),
        const SizedBox(height: 10),
        ...repo.opportunities
            .where((o) => o.type == 'internship' || o.type == 'mentorship')
            .map((opp) => _buildOpportunityCard(opp)),
      ],
    );
  }

  // 3. FACULTY ROLE DASHBOARD
  Widget _buildFacultyDashboard(BuildContext context, AlumniRepository repo, UserModel user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF065F46), Color(0xFF047857), Color(0xFF0F766E)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Academic & Faculty Portal',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                user.name,
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '${user.currentPosition ?? "Faculty Member"} • ${user.department ?? "Academic Division"}',
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 12),
              const Text(
                'Track graduate tracer outcomes, engage alumni guest lecturers, and review curriculum alignment with current industry trends.',
                style: TextStyle(color: Colors.white, fontSize: 12, height: 1.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(child: _buildStatCard('Grad Tracer Success', '94.2%', Icons.trending_up, const Color(0xFF10B981))),
            const SizedBox(width: 10),
            Expanded(child: _buildStatCard('Alumni Lecturers', '18', Icons.record_voice_over, Colors.teal)),
          ],
        ),
        const SizedBox(height: 20),

        _buildSectionHeader('Distinguished Alumni Milestones', () {}),
        const SizedBox(height: 10),
        ...repo.milestones.map((m) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFFEF3C7),
                  child: Icon(Icons.workspace_premium, color: Color(0xFFD97706)),
                ),
                title: Text(m.awardTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                subtitle: Text('${m.alumnusName} (${m.batch})\n${m.citation}', style: const TextStyle(fontSize: 11)),
                isThreeLine: true,
              ),
            )),
      ],
    );
  }

  // 4. ADMIN & STAFF ROLE DASHBOARD (With responsive Sidebar/Drawer pattern!)
  Widget _buildAdminStaffDashboard(BuildContext context, AlumniRepository repo, UserModel user) {
    final modules = [
      {'title': 'Members & Roles', 'icon': Icons.people, 'count': repo.users.length},
      {'title': 'Growth Analytics', 'icon': Icons.insights, 'count': 'Live'},
      {'title': 'Milestones & Awards', 'icon': Icons.military_tech, 'count': repo.milestones.length},
      {'title': 'Regional Chapters', 'icon': Icons.public, 'count': repo.chapters.length},
      {'title': 'Campus Gallery', 'icon': Icons.photo_library, 'count': repo.galleryItems.length},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Admin Header Banner
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3E8FF),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE9D5FF)),
                ),
                child: const Icon(Icons.shield, color: Color(0xFF9333EA), size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Alumni Association Administration',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3E8FF),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            user.role.shortName.toUpperCase(),
                            style: const TextStyle(color: Color(0xFF7E22CE), fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Verify alumni credentials, oversee chapters, manage awards, and curate heritage archives.',
                      style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Responsive Administration Module Switcher (Sidebar / Pills in Center)
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(modules.length, (idx) {
                final isSelected = _adminSelectedTab == idx;
                final mod = modules[idx];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    avatar: Icon(
                      mod['icon'] as IconData,
                      size: 14,
                      color: isSelected ? Colors.white : const Color(0xFF6B7280),
                    ),
                    label: Text(
                      '${mod['title']} (${mod['count']})',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : const Color(0xFF374151),
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: const Color(0xFF991B1B),
                    backgroundColor: const Color(0xFFF9FAFB),
                    onSelected: (val) {
                      if (val) setState(() => _adminSelectedTab = idx);
                    },
                  ),
                );
              }),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Center Display corresponding to the selected module
        if (_adminSelectedTab == 0) ...[
          // Members verification module
          _buildAdminMembersModule(repo),
        ] else if (_adminSelectedTab == 1) ...[
          // Growth analytics module
          _buildAdminAnalyticsModule(repo),
        ] else if (_adminSelectedTab == 2) ...[
          // Milestones module
          _buildAdminMilestonesModule(repo),
        ] else if (_adminSelectedTab == 3) ...[
          // Regional Chapters module
          _buildAdminChaptersModule(repo),
        ] else if (_adminSelectedTab == 4) ...[
          // Campus Gallery curator module
          _buildAdminGalleryModule(repo),
        ],
      ],
    );
  }

  // 5. SUPERADMIN ROLE DASHBOARD
  Widget _buildSuperAdminDashboard(BuildContext context, AlumniRepository repo, UserModel user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.security, color: Colors.amber, size: 22),
                  const SizedBox(width: 8),
                  const Text(
                    'Super Administrator Console',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.redAccent),
                    ),
                    child: const Text('RESTRICTED ACCESS', style: TextStyle(color: Colors.redAccent, fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'Complete system administration, access role provisioning, database sync oversight, and institutional governance.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _buildAdminMembersModule(repo),
      ],
    );
  }

  // Sub-modules for Admin Display
  Widget _buildAdminMembersModule(AlumniRepository repo) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Alumni & Member Roster', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            Text('${repo.users.length} Registered Accounts', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 10),
        ...repo.users.map((u) {
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: const Color(0xFF991B1B).withOpacity(0.1),
                child: Text(u.name[0], style: const TextStyle(color: Color(0xFF991B1B), fontWeight: FontWeight.bold)),
              ),
              title: Row(
                children: [
                  Text(u.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(width: 6),
                  if (u.isVerified)
                    const Icon(Icons.verified, size: 14, color: Colors.blue)
                ],
              ),
              subtitle: Text('${u.email}\n${u.role.displayName} • ${u.batch ?? "Batch N/A"}', style: const TextStyle(fontSize: 11)),
              isThreeLine: true,
              trailing: Switch(
                value: u.isVerified,
                activeColor: const Color(0xFF10B981),
                onChanged: (val) {
                  repo.toggleUserVerification(u.uid);
                },
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildAdminAnalyticsModule(AlumniRepository repo) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Institutional Growth & Engagement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 12),
            _buildMetricBar('Graduate Verification Rate', 0.88, '88%'),
            const SizedBox(height: 10),
            _buildMetricBar('Homecoming RSVP Capacity', 0.74, '74%'),
            const SizedBox(height: 10),
            _buildMetricBar('Job Placement Engagement', 0.62, '62%'),
          ],
        ),
      ),
    );
  }

  Widget _buildAdminMilestonesModule(AlumniRepository repo) {
    return Column(
      children: repo.milestones.map((m) {
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: const Icon(Icons.military_tech, color: Color(0xFF991B1B)),
            title: Text(m.awardTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            subtitle: Text('${m.alumnusName} (${m.batch})\n${m.citation}', style: const TextStyle(fontSize: 11)),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAdminChaptersModule(AlumniRepository repo) {
    return Column(
      children: repo.chapters.map((ch) {
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: const Icon(Icons.location_city, color: Color(0xFF991B1B)),
            title: Text(ch.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            subtitle: Text('Region: ${ch.region}\nPresident: ${ch.president} • ${ch.memberCount} Members', style: const TextStyle(fontSize: 11)),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAdminGalleryModule(AlumniRepository repo) {
    return Column(
      children: repo.galleryItems.map((g) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Image.asset(
                g.imageUrl,
                height: 150,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (ctx, err, st) => Container(
                  height: 120,
                  color: Colors.grey[200],
                  child: const Center(child: Icon(Icons.image, size: 40, color: Colors.grey)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(g.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text('${g.category} • ${g.year}', style: const TextStyle(color: Color(0xFF991B1B), fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(g.description, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  // Common Reusable UI Widgets
  Widget _buildMetricBar(String title, double progress, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF991B1B))),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: const Color(0xFFE5E7EB),
            color: const Color(0xFF991B1B),
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
          Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280))),
        ],
      ),
    );
  }

  Widget _buildActionTile(String title, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, VoidCallback onSeeAll) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
        ),
        GestureDetector(
          onTap: onSeeAll,
          child: const Text('View All', style: TextStyle(color: Color(0xFF991B1B), fontSize: 11, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildEventCard(EventModel event) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF991B1B).withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Text(
                    DateFormat('MMM').format(event.startDate).toUpperCase(),
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                  ),
                  Text(
                    DateFormat('dd').format(event.startDate),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 12, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(event.location, style: const TextStyle(fontSize: 11, color: Colors.grey), overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOpportunityCard(OpportunityModel opp) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Text(
                    opp.type.toUpperCase(),
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8)),
                  ),
                ),
                if (opp.salaryOrStipend != null)
                  Text(
                    opp.salaryOrStipend!,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF10B981)),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(opp.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 4),
            Text('${opp.company} • ${opp.location}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
            const SizedBox(height: 8),
            Text(opp.description, style: const TextStyle(fontSize: 11, color: Color(0xFF4B5563)), maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}

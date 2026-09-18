// Dart models for St. Cecilia's College Global Alumni Association

enum UserRole {
  alumni,
  student,
  faculty,
  admin,
  staff,
  superadmin,
}

extension UserRoleExtension on UserRole {
  String get displayName {
    switch (this) {
      case UserRole.alumni:
        return 'Alumni Member';
      case UserRole.student:
        return 'Undergraduate Student';
      case UserRole.faculty:
        return 'Faculty / Academic';
      case UserRole.admin:
        return 'Alumni Association Admin';
      case UserRole.staff:
        return 'Institutional Staff';
      case UserRole.superadmin:
        return 'Super Administrator';
    }
  }

  String get shortName {
    switch (this) {
      case UserRole.alumni:
        return 'Alumni';
      case UserRole.student:
        return 'Student';
      case UserRole.faculty:
        return 'Faculty';
      case UserRole.admin:
        return 'Admin';
      case UserRole.staff:
        return 'Staff';
      case UserRole.superadmin:
        return 'SuperAdmin';
    }
  }
}

class UserModel {
  final String uid;
  final String name;
  final String email;
  final UserRole role;
  final String? batch;
  final String? course;
  final String? department;
  final String? currentPosition;
  final String? company;
  final String? location;
  final String? bio;
  final String? avatarUrl;
  final bool isVerified;
  final List<String> skills;
  final String? phone;

  UserModel({
    required this.uid,
    required this.name,
    required this.email,
    required this.role,
    this.batch,
    this.course,
    this.department,
    this.currentPosition,
    this.company,
    this.location,
    this.bio,
    this.avatarUrl,
    this.isVerified = true,
    this.skills = const [],
    this.phone,
  });

  UserModel copyWith({
    String? name,
    String? email,
    UserRole? role,
    String? batch,
    String? course,
    String? department,
    String? currentPosition,
    String? company,
    String? location,
    String? bio,
    String? avatarUrl,
    bool? isVerified,
    List<String>? skills,
  }) {
    return UserModel(
      uid: uid,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      batch: batch ?? this.batch,
      course: course ?? this.course,
      department: department ?? this.department,
      currentPosition: currentPosition ?? this.currentPosition,
      company: company ?? this.company,
      location: location ?? this.location,
      bio: bio ?? this.bio,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isVerified: isVerified ?? this.isVerified,
      skills: skills ?? this.skills,
      phone: phone,
    );
  }
}

class OpportunityModel {
  final String id;
  final String title;
  final String company;
  final String location;
  final String type; // full-time, internship, mentorship, part-time
  final String description;
  final String? salaryOrStipend;
  final List<String> skills;
  final String contactEmail;
  final String postedByUid;
  final String postedByName;
  final DateTime postedDate;

  OpportunityModel({
    required this.id,
    required this.title,
    required this.company,
    required this.location,
    required this.type,
    required this.description,
    this.salaryOrStipend,
    this.skills = const [],
    required this.contactEmail,
    required this.postedByUid,
    required this.postedByName,
    required this.postedDate,
  });
}

class EventModel {
  final String id;
  final String title;
  final String description;
  final DateTime startDate;
  final DateTime? endDate;
  final String location;
  final String category;
  final int rsvpCount;
  final bool isOnline;

  EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.startDate,
    this.endDate,
    required this.location,
    required this.category,
    this.rsvpCount = 0,
    this.isOnline = false,
  });
}

class ChapterModel {
  final String id;
  final String name;
  final String region;
  final String president;
  final int memberCount;
  final String contactEmail;

  ChapterModel({
    required this.id,
    required this.name,
    required this.region,
    required this.president,
    required this.memberCount,
    required this.contactEmail,
  });
}

class MilestoneModel {
  final String id;
  final String alumnusName;
  final String batch;
  final String awardTitle;
  final String citation;
  final String year;

  MilestoneModel({
    required this.id,
    required this.alumnusName,
    required this.batch,
    required this.awardTitle,
    required this.citation,
    required this.year,
  });
}

class GalleryItemModel {
  final String id;
  final String title;
  final String category;
  final String year;
  final String imageUrl;
  final String description;

  GalleryItemModel({
    required this.id,
    required this.title,
    required this.category,
    required this.year,
    required this.imageUrl,
    required this.description,
  });
}

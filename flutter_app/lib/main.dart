import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/alumni_repository.dart';
import 'screens/landing_screen.dart';
import 'screens/combined_dashboard_screen.dart';
import 'screens/opportunities_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AlumniRepository()),
      ],
      child: const CeciliansAlumniApp(),
    ),
  );
}

class CeciliansAlumniApp extends StatelessWidget {
  const CeciliansAlumniApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "St. Cecilia's College Global Alumni Association",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF991B1B), // Institutional Crimson
        scaffoldBackgroundColor: const Color(0xFFF9FAFB),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF991B1B),
          primary: const Color(0xFF991B1B),
          secondary: const Color(0xFFD97706), // Warm Gold
          surface: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF111827),
          elevation: 0,
        ),
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 0.5,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
        ),
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    CombinedDashboardScreen(),
    OpportunitiesScreen(),
    LandingScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<AlumniRepository>();
    final isLoggedIn = repo.isLoggedIn;

    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          selectedItemColor: const Color(0xFF991B1B),
          unselectedItemColor: const Color(0xFF6B7280),
          backgroundColor: Colors.white,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          onTap: (index) => setState(() => _currentIndex = index),
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.work_outline),
              activeIcon: Icon(Icons.work),
              label: 'Job Board',
            ),
            // Only show landing view if explicitly switching or not logged in
            BottomNavigationBarItem(
              icon: const Icon(Icons.public_outlined),
              activeIcon: const Icon(Icons.public),
              label: isLoggedIn ? 'Campus' : 'Landing',
            ),
          ],
        ),
      ),
    );
  }
}

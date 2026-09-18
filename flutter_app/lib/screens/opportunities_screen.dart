import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../services/alumni_repository.dart';

class OpportunitiesScreen extends StatefulWidget {
  const OpportunitiesScreen({super.key});

  @override
  State<OpportunitiesScreen> createState() => _OpportunitiesScreenState();
}

class _OpportunitiesScreenState extends State<OpportunitiesScreen> {
  String _searchQuery = '';
  String _selectedType = 'all';

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<AlumniRepository>();

    final filtered = repo.opportunities.where((opp) {
      final matchesSearch = opp.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          opp.company.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          opp.location.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesType = _selectedType == 'all' || opp.type == _selectedType;
      return matchesSearch && matchesType;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Alumni Job Board & Mentorship', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF991B1B),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Post Opportunity', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () => _showPostModal(context, repo),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Search Box
            TextField(
              decoration: InputDecoration(
                hintText: 'Search roles, companies, or cities...',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
              ),
              onChanged: (val) => setState(() => _searchQuery = val),
            ),
            const SizedBox(height: 12),

            // Type Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('All Types', 'all'),
                  _buildFilterChip('Full-Time', 'full-time'),
                  _buildFilterChip('Internship', 'internship'),
                  _buildFilterChip('Mentorship', 'mentorship'),
                  _buildFilterChip('Part-Time', 'part-time'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Opportunity List
            Expanded(
              child: filtered.isEmpty
                  ? const Center(child: Text('No opportunities match your filter.'))
                  : ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final opp = filtered[index];
                        return _buildOpportunityCard(context, opp);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedType == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF4B5563),
          ),
        ),
        selected: isSelected,
        selectedColor: const Color(0xFF991B1B),
        backgroundColor: Colors.white,
        onSelected: (selected) {
          if (selected) setState(() => _selectedType = value);
        },
      ),
    );
  }

  Widget _buildOpportunityCard(BuildContext context, OpportunityModel opp) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 0.5,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    opp.type.toUpperCase(),
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8)),
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
            Text(opp.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.business, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(opp.company, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500)),
                const SizedBox(width: 8),
                const Icon(Icons.location_on, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(opp.location, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 10),
            Text(opp.description, style: const TextStyle(fontSize: 12, color: Color(0xFF374151), height: 1.4)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              children: opp.skills
                  .map((s) => Chip(
                        label: Text(s, style: const TextStyle(fontSize: 10)),
                        padding: EdgeInsets.zero,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        backgroundColor: const Color(0xFFF3F4F6),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Posted by ${opp.postedByName}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF991B1B),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () => _showDetailModal(context, opp),
                  icon: const Icon(Icons.mail_outline, size: 14),
                  label: const Text('Apply / Inquire', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showDetailModal(BuildContext context, OpportunityModel opp) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(opp.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('${opp.company} • ${opp.location}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 16),
            const Text('Role Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            Text(opp.description, style: const TextStyle(fontSize: 13, height: 1.4)),
            const SizedBox(height: 16),
            Text('Official Contact: ${opp.contactEmail}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF991B1B))),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF991B1B),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Contact via Email', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPostModal(BuildContext context, AlumniRepository repo) {
    final titleController = TextEditingController();
    final companyController = TextEditingController();
    final locationController = TextEditingController();
    final descController = TextEditingController();
    String oppType = 'full-time';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Post Career Opportunity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Job Title *')),
              TextField(controller: companyController, decoration: const InputDecoration(labelText: 'Company *')),
              TextField(controller: locationController, decoration: const InputDecoration(labelText: 'Location / Remote *')),
              TextField(controller: descController, decoration: const InputDecoration(labelText: 'Description *'), maxLines: 3),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF991B1B), foregroundColor: Colors.white),
            onPressed: () {
              if (titleController.text.isNotEmpty && companyController.text.isNotEmpty) {
                repo.addOpportunity(OpportunityModel(
                  id: 'opp-${DateTime.now().millisecondsSinceEpoch}',
                  title: titleController.text,
                  company: companyController.text,
                  location: locationController.text.isNotEmpty ? locationController.text : 'Cebu / Hybrid',
                  type: oppType,
                  description: descController.text,
                  contactEmail: repo.currentUser?.email ?? 'alumni@stcecilia.edu',
                  postedByUid: repo.currentUser?.uid ?? 'anon',
                  postedByName: repo.currentUser?.name ?? 'Cecilian Alumnus',
                  postedDate: DateTime.now(),
                ));
                Navigator.pop(ctx);
              }
            },
            child: const Text('Publish'),
          ),
        ],
      ),
    );
  }
}

/* =====================================================================
   seed.js — Initial seed data for first-load demo
   Idempotent: only runs if !store.isSeeded()
   ===================================================================== */

(function () {
  'use strict';

  function seedIfNeeded() {
    if (!window.store) return;

    if (!store.isSeeded()) {
      seedRooms();
      seedExtraTenants();
      seedClasses();
      seedEnrollments();
      seedPayments();
      seedMaintenance();
      seedPickups();

      store.markSeeded();
      localStorage.setItem('hms__seeded_v2', '1');
      console.log('[seed] Database seeded.');
    } else if (!localStorage.getItem('hms__seeded_v2')) {
      // V2 migration: schedule model refactor (schedules -> enrollments)
      // Re-seed classes (now with day+startTime) + enrollments + pickups
      // Drop legacy hms_schedules so old rows do not leak into new render code
      localStorage.removeItem('hms_schedules');
      seedClasses();
      seedEnrollments();
      seedPickups();
      localStorage.setItem('hms__seeded_v2', '1');
      console.log('[seed] V2 schedule model migration applied.');
    }

    // PDMS module seeds — idempotent per-table, run on every load to backfill
    seedHostels();
    seedAnnouncements();
    seedAttendance();
    seedHelpdesk();
    seedPartners();
    seedCompounds();
  }

  function seedRooms() {
    const rooms = [];
    const blocks = ['A', 'B', 'C'];
    let roomNum = 100;
    blocks.forEach((block, bi) => {
      for (let floor = 1; floor <= 3; floor++) {
        for (let i = 1; i <= 7; i++) {
          roomNum++;
          const isTwin = i % 2 === 0;
          const id = 'R-' + ((bi * 100) + (floor * 100) + i + 100);
          const isOccupied = Math.random() < 0.7;
          const isMaintenance = !isOccupied && Math.random() < 0.1;
          rooms.push({
            id: 'R-' + (200 + roomNum),
            block,
            floor,
            type: isTwin ? 'twin' : 'single',
            rate: isTwin ? 700 : 450,
            status: isMaintenance ? 'maintenance' : (isOccupied ? 'occupied' : 'vacant'),
            tenantId: null,
            amenities: ['Air Conditioning', 'WiFi', 'Study Desk', 'Wardrobe', 'Attached Bath']
          });
        }
      }
    });

    rooms.find(r => r.id === 'R-204') || rooms.push({
      id: 'R-204', block: 'A', floor: 2, type: 'twin', rate: 700,
      status: 'occupied', tenantId: 'U002',
      amenities: ['Air Conditioning', 'WiFi', 'Study Desk', 'Wardrobe', 'Attached Bath']
    });
    const r204 = rooms.find(r => r.id === 'R-204');
    if (r204) { r204.status = 'occupied'; r204.tenantId = 'U002'; }

    store.writeAll('rooms', rooms);
  }

  function seedExtraTenants() {
    store.writeAll('extra_tenants', [
      { id: 'U004', name: 'Siti Aminah',  email: 'siti@gmail.com',  role: 'tenant', roomId: 'R-118', studentId: 'STU-2026-0008', status: 'active' },
      { id: 'U005', name: 'Lee Wei',      email: 'lee@gmail.com',   role: 'tenant', roomId: 'R-301', studentId: 'STU-2026-0009', status: 'inactive' },
      { id: 'U006', name: 'Raj Kumar',    email: 'raj@gmail.com',   role: 'tenant', roomId: 'R-205', studentId: 'STU-2026-0010', status: 'active' },
      { id: 'U007', name: 'Nur Hidayah',  email: 'nur@gmail.com',   role: 'tenant', roomId: 'R-122', studentId: 'STU-2026-0011', status: 'active' }
    ]);
  }

  function seedClasses() {
    store.writeAll('classes', [
      { id: 'CLS-MATH101', name: 'Math 101',             code: 'MTH101',  day: 'Mon', startTime: '09:00' },
      { id: 'CLS-SE',      name: 'Software Engineering', code: 'CSE301',  day: 'Tue', startTime: '14:30' },
      { id: 'CLS-PHY',     name: 'Physics',              code: 'PHY101',  day: 'Tue', startTime: '11:00' },
      { id: 'CLS-DB',      name: 'Database Systems',     code: 'CSE302',  day: 'Wed', startTime: '11:00' },
      { id: 'CLS-SELAB',   name: 'Software Eng Lab',     code: 'CSE301L', day: 'Thu', startTime: '14:30' },
      { id: 'CLS-NETSEC',  name: 'Network Security',     code: 'CSE401',  day: 'Fri', startTime: '16:00' }
    ]);
  }

  function seedEnrollments() {
    store.writeAll('enrollments', [
      // Ahmad Faiz (U002) - 5 classes Mon-Fri
      { id: 'EN-MATH-U002',   userId: 'U002', studentId: 'STU-2026-0007', classId: 'CLS-MATH101', pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'EN-SE-U002',     userId: 'U002', studentId: 'STU-2026-0007', classId: 'CLS-SE',      pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'EN-DB-U002',     userId: 'U002', studentId: 'STU-2026-0007', classId: 'CLS-DB',      pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'EN-SELAB-U002',  userId: 'U002', studentId: 'STU-2026-0007', classId: 'CLS-SELAB',   pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'EN-NETSEC-U002', userId: 'U002', studentId: 'STU-2026-0007', classId: 'CLS-NETSEC',  pickupLocation: 'Block A Lobby', status: 'active' },
      // Siti Aminah (U004) - MATH + DB
      { id: 'EN-MATH-U004',   userId: 'U004', studentId: 'STU-2026-0008', classId: 'CLS-MATH101', pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'EN-DB-U004',     userId: 'U004', studentId: 'STU-2026-0008', classId: 'CLS-DB',      pickupLocation: 'Block A Lobby', status: 'active' },
      // Raj Kumar (U006) - MATH + SE + PHY (PHY supports PK-2 demo pickup)
      { id: 'EN-MATH-U006',   userId: 'U006', studentId: 'STU-2026-0010', classId: 'CLS-MATH101', pickupLocation: 'Block B Lobby', status: 'active' },
      { id: 'EN-SE-U006',     userId: 'U006', studentId: 'STU-2026-0010', classId: 'CLS-SE',      pickupLocation: 'Block B Lobby', status: 'active' },
      { id: 'EN-PHY-U006',    userId: 'U006', studentId: 'STU-2026-0010', classId: 'CLS-PHY',     pickupLocation: 'Block B Lobby', status: 'active' },
      // Nur Hidayah (U007) - DB + NETSEC
      { id: 'EN-DB-U007',     userId: 'U007', studentId: 'STU-2026-0011', classId: 'CLS-DB',      pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'EN-NETSEC-U007', userId: 'U007', studentId: 'STU-2026-0011', classId: 'CLS-NETSEC',  pickupLocation: 'Block A Lobby', status: 'active' }
    ]);
  }

  function seedPayments() {
    const months = [
      { period: '2026-02', paidOn: '2026-02-03' },
      { period: '2026-03', paidOn: '2026-03-01' },
      { period: '2026-04', paidOn: '2026-04-02' }
    ];
    const tenantPayments = months.map(m => ({
      id: store.generateId('payments'),
      userId: 'U002',
      tenantName: 'Ahmad Faiz',
      roomId: 'R-204',
      period: m.period,
      amount: 700,
      status: 'paid',
      paidOn: m.paidOn,
      method: 'FPX'
    }));

    const others = [
      { id: store.generateId('payments'), userId: 'U004', tenantName: 'Siti Aminah', roomId: 'R-118', period: '2026-04', amount: 450, status: 'due',  paidOn: null, method: null },
      { id: store.generateId('payments'), userId: 'U005', tenantName: 'Lee Wei',     roomId: 'R-301', period: '2026-04', amount: 450, status: 'late', paidOn: null, method: null },
      { id: store.generateId('payments'), userId: 'U006', tenantName: 'Raj Kumar',   roomId: 'R-205', period: '2026-04', amount: 450, status: 'paid', paidOn: '2026-04-05', method: 'Card' },
      { id: store.generateId('payments'), userId: 'U007', tenantName: 'Nur Hidayah', roomId: 'R-122', period: '2026-04', amount: 450, status: 'paid', paidOn: '2026-04-01', method: 'Bank' }
    ];

    store.writeAll('payments', [...tenantPayments, ...others]);
  }

  function seedMaintenance() {
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();

    store.writeAll('maintenance', [
      {
        id: 'M01',
        roomId: 'R-204',
        userId: 'U002',
        reportedBy: 'Ahmad Faiz',
        category: 'plumbing',
        title: 'Leaky tap',
        description: 'Bathroom tap drips constantly. Water bills are climbing and the sound is disturbing my sleep.',
        urgency: 'medium',
        photos: 1,
        status: 'new',
        assignedTo: null,
        notes: '',
        reportedAt: hoursAgo(2)
      },
      {
        id: 'M02',
        roomId: 'R-118',
        userId: 'U004',
        reportedBy: 'Siti Aminah',
        category: 'electrical',
        title: 'AC noisy',
        description: 'Air conditioner makes a loud rattling noise especially at night.',
        urgency: 'medium',
        photos: 2,
        status: 'in_progress',
        assignedTo: 'Maintenance Team',
        notes: 'Technician scheduled for tomorrow.',
        reportedAt: hoursAgo(4)
      },
      {
        id: 'M03',
        roomId: 'R-301',
        userId: 'U005',
        reportedBy: 'Lee Wei',
        category: 'security',
        title: 'Door lock stuck',
        description: 'Door lock requires multiple attempts to engage.',
        urgency: 'high',
        photos: 0,
        status: 'in_progress',
        assignedTo: 'Locksmith',
        notes: '',
        reportedAt: hoursAgo(24)
      },
      {
        id: 'M04',
        roomId: 'R-205',
        userId: 'U006',
        reportedBy: 'Raj Kumar',
        category: 'internet',
        title: 'WiFi outage',
        description: 'WiFi has been down since this morning.',
        urgency: 'high',
        photos: 0,
        status: 'resolved',
        assignedTo: 'IT Support',
        notes: 'Router restarted, link restored.',
        reportedAt: hoursAgo(48)
      },
      {
        id: 'M07',
        roomId: 'R-204',
        userId: 'U002',
        reportedBy: 'Ahmad Faiz',
        category: 'electrical',
        title: 'Light bulb flickering',
        description: 'Ceiling light flickers intermittently.',
        urgency: 'low',
        photos: 0,
        status: 'resolved',
        assignedTo: 'Maintenance Team',
        notes: 'Bulb replaced.',
        reportedAt: hoursAgo(120)
      }
    ]);
  }

  function seedPickups() {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    store.writeAll('pickups', [
      { id: 'PK-1', driverId: 'U003', enrollmentId: 'EN-MATH-U002', classId: 'CLS-MATH101', userId: 'U002', studentId: 'STU-2026-0007', date: todayStr, status: 'completed', studentCount: 3, classLabel: 'Math 101' },
      { id: 'PK-2', driverId: 'U003', enrollmentId: 'EN-PHY-U006',  classId: 'CLS-PHY',     userId: 'U006', studentId: 'STU-2026-0010', date: todayStr, status: 'completed', studentCount: 1, classLabel: 'Physics' }
    ]);
  }

  /* ===================================================================
     PDMS module seed (Phase 5) — idempotent per-table backfill
     =================================================================== */

  function seedHostels() {
    if (store.readAll('hostels').length > 0) return;
    store.writeAll('hostels', [{
      id: 'H-001',
      name: 'Asrama Mahkota',
      address: 'Jalan Universiti, 81310 Skudai, Johor',
      capacity: 60,
      blocks: ['A', 'B', 'C'],
      managerId: 'U001',
      managerName: 'Hostel Admin',
      contactPhone: '+60 7-557 3000',
      contactEmail: 'admin@asramamahkota.my',
      established: '2024-08-01',
      amenities: ['Wi-Fi', 'AC', '24/7 Security', 'Laundry', 'Cafeteria', 'Study Lounge', 'Prayer Room']
    }]);
  }

  function seedAnnouncements() {
    if (store.readAll('announcements').length > 0) return;
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();
    const daysAgo = (d) => hoursAgo(d * 24);
    store.writeAll('announcements', [
      { id: 'AN-001', title: 'Water tank maintenance Saturday 8 AM - 12 PM', body: 'Block A water supply will be temporarily shut off for routine tank cleaning. Please store water beforehand.', audience: 'all', priority: 'high', createdBy: 'Hostel Admin', createdAt: hoursAgo(6) },
      { id: 'AN-002', title: 'New cafeteria opening hours from May 6', body: 'Cafeteria will operate 7 AM to 10 PM weekdays, 8 AM to 9 PM weekends.', audience: 'all', priority: 'normal', createdBy: 'Hostel Admin', createdAt: daysAgo(1) },
      { id: 'AN-003', title: 'Tenant satisfaction survey - closes May 12', body: 'Help us improve - 5 minute survey link sent to your email.', audience: 'tenant', priority: 'normal', createdBy: 'Hostel Admin', createdAt: daysAgo(2) },
      { id: 'AN-004', title: 'Parking permit renewal due', body: 'Annual parking permits expire May 31. Renew at the front office.', audience: 'all', priority: 'normal', createdBy: 'Hostel Admin', createdAt: daysAgo(4) }
    ]);
  }

  function seedAttendance() {
    if (store.readAll('attendance').length > 0) return;
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();
    store.writeAll('attendance', [
      { id: 'AT-001', userId: 'U002', studentName: 'Ahmad Faiz',   studentId: 'STU-2026-0007', event: 'in',  location: 'Block A Lobby', recordedAt: hoursAgo(1),  method: 'geofence' },
      { id: 'AT-002', userId: 'U002', studentName: 'Ahmad Faiz',   studentId: 'STU-2026-0007', event: 'out', location: 'Block A Lobby', recordedAt: hoursAgo(8),  method: 'geofence' },
      { id: 'AT-003', userId: 'U004', studentName: 'Siti Aminah',  studentId: 'STU-2026-0011', event: 'in',  location: 'Block A Lobby', recordedAt: hoursAgo(2),  method: 'geofence' },
      { id: 'AT-004', userId: 'U005', studentName: 'Lee Wei',      studentId: 'STU-2026-0014', event: 'in',  location: 'Block C Lobby', recordedAt: hoursAgo(3),  method: 'manual' },
      { id: 'AT-005', userId: 'U006', studentName: 'Raj Kumar',    studentId: 'STU-2026-0019', event: 'out', location: 'Block A Lobby', recordedAt: hoursAgo(5),  method: 'geofence' },
      { id: 'AT-006', userId: 'U007', studentName: 'Nur Hidayah',  studentId: 'STU-2026-0023', event: 'in',  location: 'Block A Lobby', recordedAt: hoursAgo(10), method: 'geofence' }
    ]);
  }

  function seedHelpdesk() {
    if (store.readAll('helpdesk').length > 0) return;
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();
    const daysAgo = (d) => hoursAgo(d * 24);
    store.writeAll('helpdesk', [
      { id: 'HD-001', subject: 'Cant login to portal after password reset', requester: 'Ahmad Faiz',  requesterId: 'U002', category: 'account', priority: 'high',   status: 'open',         assignedTo: 'IT Support',   createdAt: hoursAgo(2), updatedAt: hoursAgo(1) },
      { id: 'HD-002', subject: 'Lost key fob replacement',                  requester: 'Siti Aminah', requesterId: 'U004', category: 'access',  priority: 'medium', status: 'in_progress',  assignedTo: 'Front Office', createdAt: hoursAgo(8), updatedAt: hoursAgo(4) },
      { id: 'HD-003', subject: 'Request to change roommate',                requester: 'Lee Wei',     requesterId: 'U005', category: 'room',    priority: 'low',    status: 'open',         assignedTo: null,           createdAt: daysAgo(1),  updatedAt: daysAgo(1) },
      { id: 'HD-004', subject: 'Receipt not received for April rent',       requester: 'Raj Kumar',   requesterId: 'U006', category: 'billing', priority: 'medium', status: 'resolved',     assignedTo: 'Finance',      createdAt: daysAgo(3),  updatedAt: daysAgo(2) }
    ]);
  }

  function seedPartners() {
    if (store.readAll('partners').length > 0) return;
    store.writeAll('partners', [
      { id: 'UP-001', name: 'Universiti Teknologi Malaysia (UTM)', shortName: 'UTM', mouSigned: '2024-09-15', studentCount: 38, contactPerson: 'Dr Faridah Ali',     contactEmail: 'liaison@utm.my' },
      { id: 'UP-002', name: 'Universiti Sains Malaysia (USM)',     shortName: 'USM', mouSigned: '2025-01-20', studentCount: 14, contactPerson: 'Prof Goh Wei',       contactEmail: 'student.aff@usm.my' },
      { id: 'UP-003', name: 'Universiti Malaya (UM)',              shortName: 'UM',  mouSigned: '2025-06-10', studentCount: 9,  contactPerson: 'Dr Aminah Ibrahim',  contactEmail: 'partnership@um.edu.my' }
    ]);
  }

  function seedCompounds() {
    if (store.readAll('compounds').length > 0) return;
    const now = Date.now();
    const daysAgo = (d) => new Date(now - d * 24 * 3600 * 1000).toISOString();
    store.writeAll('compounds', [
      { id: 'CP-001', studentName: 'Lee Wei',   studentId: 'STU-2026-0014', violation: 'Late curfew - returned 1:30 AM (curfew 12 AM)', amount: 50, status: 'unpaid', issuedAt: daysAgo(2), issuedBy: 'Block C Warden', paidOn: null },
      { id: 'CP-002', studentName: 'Raj Kumar', studentId: 'STU-2026-0019', violation: 'Cleanliness inspection failed - kitchen area',  amount: 30, status: 'paid',   issuedAt: daysAgo(7), issuedBy: 'Block A Warden', paidOn: daysAgo(5) }
    ]);
  }

  if (window.store) {
    seedIfNeeded();
  } else {
    document.addEventListener('DOMContentLoaded', seedIfNeeded);
  }

  window.seed = { run: seedIfNeeded };
})();

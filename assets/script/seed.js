/* =====================================================================
   seed.js — Initial seed data for first-load demo
   Idempotent: only runs if !store.isSeeded()
   ===================================================================== */

(function () {
  'use strict';

  function seedIfNeeded() {
    if (!window.store) return;
    if (store.isSeeded()) return;

    seedRooms();
    seedExtraTenants();
    seedClasses();
    seedSchedules();
    seedPayments();
    seedMaintenance();
    seedPickups();

    store.markSeeded();
    console.log('[seed] Database seeded.');
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
      { id: 'CLS-MATH101', name: 'Math 101',         code: 'MTH101' },
      { id: 'CLS-SE',      name: 'Software Engineering', code: 'CSE301' },
      { id: 'CLS-DB',      name: 'Database Systems', code: 'CSE302' },
      { id: 'CLS-SELAB',   name: 'Software Eng Lab', code: 'CSE301L' },
      { id: 'CLS-NETSEC',  name: 'Network Security', code: 'CSE401' },
      { id: 'CLS-PHY',     name: 'Physics',          code: 'PHY101' }
    ]);
  }

  function seedSchedules() {
    store.writeAll('schedules', [
      { id: 'SCH-Mon-0900', studentId: 'STU-2026-0007', userId: 'U002', day: 'Mon', startTime: '09:00', classId: 'CLS-MATH101', pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'SCH-Tue-1430', studentId: 'STU-2026-0007', userId: 'U002', day: 'Tue', startTime: '14:30', classId: 'CLS-SE',      pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'SCH-Wed-1100', studentId: 'STU-2026-0007', userId: 'U002', day: 'Wed', startTime: '11:00', classId: 'CLS-DB',      pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'SCH-Thu-1430', studentId: 'STU-2026-0007', userId: 'U002', day: 'Thu', startTime: '14:30', classId: 'CLS-SELAB',   pickupLocation: 'Block A Lobby', status: 'active' },
      { id: 'SCH-Fri-1600', studentId: 'STU-2026-0007', userId: 'U002', day: 'Fri', startTime: '16:00', classId: 'CLS-NETSEC',  pickupLocation: 'Block A Lobby', status: 'active' }
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
      { id: 'PK-1', driverId: 'U003', scheduleId: 'SCH-Mon-0900', date: todayStr, status: 'completed', studentCount: 3, classLabel: 'Math 101' },
      { id: 'PK-2', driverId: 'U003', scheduleId: 'SCH-Tue-1100', date: todayStr, status: 'completed', studentCount: 2, classLabel: 'Physics' }
    ]);
  }

  if (window.store) {
    seedIfNeeded();
  } else {
    document.addEventListener('DOMContentLoaded', seedIfNeeded);
  }

  window.seed = { run: seedIfNeeded };
})();

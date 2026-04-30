/* =====================================================================
   auth.js — Hardcoded users, login, logout, role guards
   No real backend. Session lives in localStorage with 24h TTL.
   ===================================================================== */

(function () {
  'use strict';

  const SESSION_KEY = 'hms_session';
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

  const USERS = [
    {
      id: 'U001',
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin',
      name: 'Hostel Admin',
      phone: '+60-12-345-6789'
    },
    {
      id: 'U002',
      email: 'student1@gmail.com',
      password: 'student123',
      role: 'tenant',
      name: 'Ahmad Faiz',
      phone: '+60-11-222-3333',
      roomId: 'R-204',
      studentId: 'STU-2026-0007',
      moveInDate: '2026-01-15',
      leaseEnd: '2026-12-31'
    },
    {
      id: 'U003',
      email: 'driver@gmail.com',
      password: 'driver123',
      role: 'driver',
      name: 'Pak Lim',
      phone: '+60-13-444-5555',
      vehiclePlate: 'WMK 1234',
      vehicleCapacity: 12
    }
  ];

  function login(email, password) {
    const user = USERS.find(u =>
      u.email.toLowerCase() === String(email).toLowerCase().trim() &&
      u.password === password
    );
    if (!user) {
      return { ok: false, error: 'Invalid email or password.' };
    }
    const session = {
      userId: user.id,
      role: user.role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, user, session };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = resolveLandingPath();
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session.expiresAt || Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    return USERS.find(u => u.id === session.userId) || null;
  }

  function requireRole(allowedRoles) {
    const session = getSession();
    if (!session) {
      window.location.href = resolveLandingPath();
      return null;
    }
    if (!allowedRoles.includes(session.role)) {
      window.location.href = resolveLandingPath();
      return null;
    }
    return getCurrentUser();
  }

  function dashboardPath(role) {
    const base = resolveBase();
    switch (role) {
      case 'admin':  return base + 'admin/';
      case 'tenant': return base + 'tenant/';
      case 'driver': return base + 'driver/';
      default:       return base;
    }
  }

  function resolveLandingPath() {
    return resolveBase() + 'index.html';
  }

  function resolveBase() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const known = ['admin', 'tenant', 'driver'];
    if (segments.length > 0 && known.includes(segments[segments.length - 1].replace(/\/$/, '')) ) {
      return path.replace(/[^/]+\/?$/, '');
    }
    if (segments.length > 0 && known.includes(segments[segments.length - 2])) {
      return path.replace(/[^/]+\/[^/]*$/, '');
    }
    return path.endsWith('/') ? path : path.replace(/[^/]+$/, '');
  }

  function changePassword(userId, currentPassword, newPassword) {
    const user = USERS.find(u => u.id === userId);
    if (!user) return { ok: false, error: 'User not found.' };
    if (user.password !== currentPassword) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters.' };
    }
    user.password = newPassword;
    return { ok: true };
  }

  function listUsers() {
    return USERS.map(u => ({ ...u, password: undefined }));
  }

  window.auth = {
    login,
    logout,
    getSession,
    getCurrentUser,
    requireRole,
    dashboardPath,
    changePassword,
    listUsers,
    USERS
  };
})();

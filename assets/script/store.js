/* =====================================================================
   store.js — localStorage CRUD wrapper
   Mock backend. Each "table" is a JSON array under a single key.
   ===================================================================== */

(function () {
  'use strict';

  const PREFIX = 'hms_';

  function key(table) { return PREFIX + table; }

  function readAll(table) {
    try {
      const raw = localStorage.getItem(key(table));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('store.readAll error', table, e);
      return [];
    }
  }

  function writeAll(table, rows) {
    localStorage.setItem(key(table), JSON.stringify(rows));
  }

  function find(table, predicate) {
    return readAll(table).find(predicate) || null;
  }

  function findById(table, id) {
    return readAll(table).find(r => r.id === id) || null;
  }

  function filter(table, predicate) {
    return readAll(table).filter(predicate);
  }

  function insert(table, row) {
    const rows = readAll(table);
    if (!row.id) row.id = generateId(table);
    if (!row.createdAt) row.createdAt = new Date().toISOString();
    rows.push(row);
    writeAll(table, rows);
    return row;
  }

  function update(table, id, patch) {
    const rows = readAll(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() };
    writeAll(table, rows);
    return rows[idx];
  }

  function remove(table, id) {
    const rows = readAll(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return false;
    rows.splice(idx, 1);
    writeAll(table, rows);
    return true;
  }

  function clear(table) {
    localStorage.removeItem(key(table));
  }

  function clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }

  function generateId(table) {
    const prefix = {
      rooms:        'R-',
      schedules:    'SCH-',
      maintenance:  'M',
      payments:     'P',
      pickups:      'PK-',
      classes:      'CLS-',
      users:        'U'
    }[table] || (table.toUpperCase().slice(0, 3) + '-');
    const n = Math.floor(Math.random() * 9000) + 1000;
    return prefix + n;
  }

  function isSeeded() {
    return localStorage.getItem(key('_seeded')) === '1';
  }

  function markSeeded() {
    localStorage.setItem(key('_seeded'), '1');
  }

  window.store = {
    readAll,
    writeAll,
    find,
    findById,
    filter,
    insert,
    update,
    remove,
    clear,
    clearAll,
    generateId,
    isSeeded,
    markSeeded
  };
})();

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const authCtrl       = require('../controllers/authController');
const empCtrl        = require('../controllers/employeeController');
const attCtrl        = require('../controllers/attendanceController');
const reportCtrl     = require('../controllers/reportController');
const { query }      = require('../config/db');

// ── AUTH ─────────────────────────────────────────────────────
router.post('/auth/login',           authCtrl.login);
router.get ('/auth/me',              authenticate, authCtrl.me);
router.put ('/auth/change-password', authenticate, authCtrl.changePassword);

// ── EMPLOYEES ────────────────────────────────────────────────
router.get ('/employees',     authenticate, empCtrl.list);
router.post('/employees',     authenticate, authorize('admin','hr'), empCtrl.create);
router.get ('/employees/:id', authenticate, empCtrl.getOne);
router.put ('/employees/:id', authenticate, authorize('admin','hr'), empCtrl.update);
router.delete('/employees/:id', authenticate, authorize('admin'), empCtrl.remove);

// ── ATTENDANCE ───────────────────────────────────────────────
router.post('/attendance/checkin',  authenticate, attCtrl.checkIn);
router.post('/attendance/checkout', authenticate, attCtrl.checkOut);
router.get ('/attendance/today',    authenticate, attCtrl.today);
router.get ('/attendance',          authenticate, attCtrl.list);
router.post('/attendance/manual',   authenticate, authorize('admin','hr'), attCtrl.manual);

// ── REPORTS ──────────────────────────────────────────────────
router.get('/reports/dashboard',        authenticate, reportCtrl.dashboardStats);
router.get('/reports/monthly',          authenticate, reportCtrl.monthly);
router.get('/reports/employee/:id',     authenticate, reportCtrl.byEmployee);
router.get('/reports/departments',      authenticate, reportCtrl.departments);
router.get('/reports/export',           authenticate, authorize('admin','hr'), reportCtrl.exportCsv);

// ── DEPARTMENTS ──────────────────────────────────────────────
router.get('/departments', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM departments ORDER BY name');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── HEALTH ───────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

module.exports = router;

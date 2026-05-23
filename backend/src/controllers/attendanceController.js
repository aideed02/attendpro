const prisma = require('../config/prisma');

const toDate = (d) => new Date(d + 'T00:00:00.000Z');

// GET /api/attendance?date=&departmentId=&status=&page=
const getAll = async (req, res) => {
  try {
    const { date, departmentId, status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      employee: { companyId: req.admin.companyId, ...(departmentId && { departmentId }) },
      ...(date && { date: toDate(date) }),
      ...(status && { status }),
    };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where, skip, take: parseInt(limit),
        include: { employee: { include: { department: true } } },
        orderBy: [{ date: 'desc' }, { checkIn: 'asc' }],
      }),
      prisma.attendance.count({ where }),
    ]);

    res.json({ success: true, data: records, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/checkin
const checkIn = async (req, res) => {
  try {
    const { employeeId, method = 'Manual', notes } = req.body;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const date = toDate(dateStr);

    const emp = await prisma.employee.findFirst({ where: { id: employeeId, companyId: req.admin.companyId }, include: { company: true } });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const existing = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date } } });
    if (existing?.checkIn) return res.status(409).json({ success: false, message: 'Already checked in today' });

    const [startH, startM] = emp.company.workStartTime.split(':').map(Number);
    const threshold = emp.company.lateThreshold;
    const limitMins = startH * 60 + startM + threshold;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const status = nowMins > limitMins ? 'Late' : 'Present';

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: { employeeId, date, checkIn: now, status, method, notes },
      update: { checkIn: now, status, method, notes },
      include: { employee: { include: { department: true } } },
    });

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/checkout
const checkOut = async (req, res) => {
  try {
    const { employeeId, method = 'Manual' } = req.body;
    const now = new Date();
    const date = toDate(now.toISOString().split('T')[0]);

    const record = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date } } });
    if (!record) return res.status(404).json({ success: false, message: 'No check-in found for today' });
    if (record.checkOut) return res.status(409).json({ success: false, message: 'Already checked out today' });

    const hours = record.checkIn ? (now - new Date(record.checkIn)) / 3600000 : 0;

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: now, hours: parseFloat(hours.toFixed(2)), method },
      include: { employee: { include: { department: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/manual
const manual = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;
    const dateObj = toDate(date);
    const ciDate = checkIn ? new Date(`${date}T${checkIn}:00`) : null;
    const coDate = checkOut ? new Date(`${date}T${checkOut}:00`) : null;
    const hours = ciDate && coDate ? (coDate - ciDate) / 3600000 : null;

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: dateObj } },
      create: { employeeId, date: dateObj, checkIn: ciDate, checkOut: coDate, status, hours, notes, method: 'Manual' },
      update: { checkIn: ciDate, checkOut: coDate, status, hours, notes, method: 'Manual' },
      include: { employee: { include: { department: true } } },
    });

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/today-summary
const todaySummary = async (req, res) => {
  try {
    const date = toDate(new Date().toISOString().split('T')[0]);
    const total = await prisma.employee.count({ where: { companyId: req.admin.companyId, status: 'Active' } });
    const records = await prisma.attendance.findMany({
      where: { date, employee: { companyId: req.admin.companyId } },
      include: { employee: { include: { department: true } } },
      orderBy: { checkIn: 'desc' },
    });

    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    const absent = total - present - late;

    res.json({ success: true, data: { total, present, late, absent, records } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, checkIn, checkOut, manual, todaySummary };

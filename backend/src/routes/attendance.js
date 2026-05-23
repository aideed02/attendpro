const router = require('express').Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Helper: compute status based on check-in time vs company settings
async function computeStatus(checkIn, companyId) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!checkIn) return 'Absent';
  const [sh, sm] = company.workStartTime.split(':').map(Number);
  const threshold = company.lateThreshold || 15;
  const checkInDate = new Date(checkIn);
  const startMinutes = sh * 60 + sm;
  const checkInMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();
  return checkInMinutes > startMinutes + threshold ? 'Late' : 'Present';
}

// GET /api/attendance - list with filters
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate, employeeId, dept, status } = req.query;
    const where = {
      employee: { companyId: req.companyId },
      ...(employeeId && { employeeId }),
      ...(status && { status }),
      ...(dept && { employee: { companyId: req.companyId, department: { name: dept } } }),
    };
    if (date) {
      where.date = new Date(date);
    } else if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }
    const records = await prisma.attendance.findMany({
      where,
      include: { employee: { include: { department: true } } },
      orderBy: [{ date: 'desc' }, { checkIn: 'asc' }],
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/checkin - fingerprint or QR check-in
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, method = 'Manual', fingerprintId } = req.body;

    let emp;
    if (fingerprintId) {
      emp = await prisma.employee.findFirst({ where: { fingerprintId, companyId: req.companyId } });
    } else if (employeeId) {
      emp = await prisma.employee.findFirst({ where: { id: employeeId, companyId: req.companyId } });
    }
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
    });
    if (existing?.checkIn) return res.status(400).json({ error: `${emp.name} already checked in at ${existing.checkIn.toTimeString().slice(0,5)}` });

    const status = await computeStatus(now, req.companyId);
    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
      update: { checkIn: now, status, method },
      create: { employeeId: emp.id, date: today, checkIn: now, status, method },
      include: { employee: { include: { department: true } } },
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/checkout
router.post('/checkout', async (req, res) => {
  try {
    const { employeeId, fingerprintId } = req.body;
    let emp;
    if (fingerprintId) {
      emp = await prisma.employee.findFirst({ where: { fingerprintId, companyId: req.companyId } });
    } else {
      emp = await prisma.employee.findFirst({ where: { id: employeeId, companyId: req.companyId } });
    }
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const record = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
    });
    if (!record?.checkIn) return res.status(400).json({ error: 'No check-in found for today' });
    if (record.checkOut) return res.status(400).json({ error: `Already checked out at ${record.checkOut.toTimeString().slice(0,5)}` });

    const hours = (now - record.checkIn) / 3600000;
    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: now, hours: parseFloat(hours.toFixed(2)) },
      include: { employee: { include: { department: true } } },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/manual - manual entry
router.post('/manual', async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;
    const emp = await prisma.employee.findFirst({ where: { id: employeeId, companyId: req.companyId } });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const dateObj = new Date(date);
    const checkInDate = checkIn ? new Date(`${date}T${checkIn}`) : null;
    const checkOutDate = checkOut ? new Date(`${date}T${checkOut}`) : null;
    const hours = checkInDate && checkOutDate ? parseFloat(((checkOutDate - checkInDate) / 3600000).toFixed(2)) : null;

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: dateObj } },
      update: { checkIn: checkInDate, checkOut: checkOutDate, status, hours, notes, method: 'Manual' },
      create: { employeeId, date: dateObj, checkIn: checkInDate, checkOut: checkOutDate, status, hours, notes, method: 'Manual' },
      include: { employee: { include: { department: true } } },
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/attendance/:id - update a record
router.put('/:id', async (req, res) => {
  try {
    const { status, notes, checkIn, checkOut } = req.body;
    const updated = await prisma.attendance.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

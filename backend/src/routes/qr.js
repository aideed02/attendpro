const router = require('express').Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Generate QR token for an employee (authenticated)
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.body;
    const emp = await prisma.employee.findFirst({ where: { id: employeeId, companyId: req.companyId } });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const expiryMins = parseInt(process.env.QR_EXPIRY_MINUTES) || 5;
    const expiresAt = new Date(Date.now() + expiryMins * 60 * 1000);

    // Invalidate old tokens
    await prisma.qRToken.updateMany({ where: { employeeId, used: false }, data: { used: true } });

    const qrToken = await prisma.qRToken.create({ data: { employeeId, expiresAt } });
    const qrData = JSON.stringify({ token: qrToken.token, empId: employeeId });
    const qrImage = await QRCode.toDataURL(qrData);

    res.json({ token: qrToken.token, qrImage, expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/qr/scan - employee scans QR to check in
router.post('/scan', async (req, res) => {
  try {
    const { token } = req.body;
    const qrToken = await prisma.qRToken.findUnique({ where: { token }, include: { employee: { include: { department: true } } } });
    if (!qrToken) return res.status(400).json({ error: 'Invalid QR code' });
    if (qrToken.used) return res.status(400).json({ error: 'QR code already used' });
    if (new Date() > qrToken.expiresAt) return res.status(400).json({ error: 'QR code expired' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: qrToken.employeeId, date: today } },
    });
    if (existing?.checkIn) return res.status(400).json({ error: 'Already checked in today' });

    const company = await prisma.company.findUnique({ where: { id: qrToken.employee.companyId } });
    const [sh, sm] = company.workStartTime.split(':').map(Number);
    const status = (now.getHours() * 60 + now.getMinutes()) > (sh * 60 + sm + company.lateThreshold) ? 'Late' : 'Present';

    const [record] = await prisma.$transaction([
      prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: qrToken.employeeId, date: today } },
        update: { checkIn: now, status, method: 'QR Code' },
        create: { employeeId: qrToken.employeeId, date: today, checkIn: now, status, method: 'QR Code' },
      }),
      prisma.qRToken.update({ where: { id: qrToken.id }, data: { used: true } }),
    ]);

    res.json({ success: true, employee: qrToken.employee.name, status, checkIn: now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

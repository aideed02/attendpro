const prisma = require('../config/prisma');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// POST /api/qr/generate/:employeeId
const generate = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const emp = await prisma.employee.findFirst({ where: { id: employeeId, companyId: req.admin.companyId } });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const expiry = parseInt(process.env.QR_EXPIRY_MINUTES || 5);
    const expiresAt = new Date(Date.now() + expiry * 60 * 1000);
    const token = uuidv4();

    await prisma.qRToken.create({ data: { token, employeeId, expiresAt } });

    const url = `${process.env.FRONTEND_URL}/checkin?token=${token}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });

    res.json({ success: true, data: { token, expiresAt, qrDataUrl, url } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/qr/scan
const scan = async (req, res) => {
  try {
    const { token } = req.body;
    const qr = await prisma.qRToken.findUnique({ where: { token }, include: { employee: { include: { company: true } } } });

    if (!qr) return res.status(404).json({ success: false, message: 'Invalid QR code' });
    if (qr.used) return res.status(400).json({ success: false, message: 'QR code already used' });
    if (new Date() > qr.expiresAt) return res.status(400).json({ success: false, message: 'QR code expired' });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const date = new Date(dateStr + 'T00:00:00.000Z');

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: qr.employeeId, date } },
    });

    if (existing?.checkIn) {
      await prisma.qRToken.update({ where: { id: qr.id }, data: { used: true } });
      return res.status(409).json({ success: false, message: 'Already checked in today' });
    }

    const [sh, sm] = qr.employee.company.workStartTime.split(':').map(Number);
    const threshold = qr.employee.company.lateThreshold;
    const limitMins = sh * 60 + sm + threshold;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const status = nowMins > limitMins ? 'Late' : 'Present';

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: qr.employeeId, date } },
      create: { employeeId: qr.employeeId, date, checkIn: now, status, method: 'QR Code' },
      update: { checkIn: now, status, method: 'QR Code' },
    });

    await prisma.qRToken.update({ where: { id: qr.id }, data: { used: true } });

    res.json({ success: true, data: { employee: qr.employee.name, status, checkIn: now } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { generate, scan };

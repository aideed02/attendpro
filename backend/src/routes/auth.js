const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register - Register company + admin
router.post('/register', async (req, res) => {
  try {
    const { companyName, adminName, email, password } = req.body;
    if (!companyName || !adminName || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const exists = await prisma.admin.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const company = await prisma.company.create({
      data: {
        name: companyName,
        departments: {
          create: ['Engineering','Design','Marketing','HR','Finance','Operations'].map(name => ({ name }))
        },
        admins: { create: { name: adminName, email, password: hashed } },
        devices: {
          create: [
            { name: 'Main Entrance', location: 'Door #1', ipAddress: '192.168.1.101', type: 'Fingerprint', status: 'Online' },
            { name: 'Back Door', location: 'Door #2', ipAddress: '192.168.1.102', type: 'Fingerprint', status: 'Online' },
          ]
        }
      },
      include: { admins: true }
    });

    const admin = company.admins[0];
    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.status(201).json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, companyId: company.id, companyName: company.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { email }, include: { company: true } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, companyId: admin.companyId, companyName: admin.company.name });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ admin: { id: req.admin.id, name: req.admin.name, email: req.admin.email, role: req.admin.role }, company: req.admin.company });
});

module.exports = router;

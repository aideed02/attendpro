const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const signToken = (admin) =>
  jwt.sign(
    { id: admin.id, email: admin.email, companyId: admin.companyId, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async (req, res) => {
  try {
    const { companyName, adminName, email, password, workStartTime, workEndTime } = req.body;
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const company = await prisma.company.create({
      data: { name: companyName, workStartTime: workStartTime || '09:00', workEndTime: workEndTime || '18:00' },
    });

    const deptNames = ['Engineering','Design','Marketing','HR','Finance','Operations'];
    await prisma.department.createMany({
      data: deptNames.map((name) => ({ name, companyId: company.id })),
    });

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: { name: adminName, email, password: hashed, companyId: company.id, role: 'SUPER_ADMIN' },
    });

    const token = signToken(admin);
    res.status(201).json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, companyId: admin.companyId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { email }, include: { company: true } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = signToken(admin);
    res.json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, company: admin.company } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const me = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      include: { company: true },
    });
    const { password: _, ...safeAdmin } = admin;
    res.json({ success: true, admin: safeAdmin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, me };

const router = require('express').Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET all employees
router.get('/', async (req, res) => {
  try {
    const { dept, status, search } = req.query;
    const where = {
      companyId: req.companyId,
      ...(status && { status }),
      ...(dept && { department: { name: dept } }),
      ...(search && { OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ]}),
    };
    const employees = await prisma.employee.findMany({
      where,
      include: { department: true },
      orderBy: { name: 'asc' },
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: {
        department: true,
        attendance: { orderBy: { date: 'desc' }, take: 30 },
      },
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create employee
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, role, departmentId, fingerprintId, employeeCode } = req.body;
    if (!name || !email || !role || !departmentId)
      return res.status(400).json({ error: 'name, email, role, departmentId required' });

    // Auto-generate code if not provided
    const code = employeeCode || `EMP${String(Date.now()).slice(-5)}`;
    const emp = await prisma.employee.create({
      data: { name, email, phone, role, departmentId, fingerprintId, employeeCode: code, companyId: req.companyId },
      include: { department: true },
    });
    res.status(201).json(emp);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email or employee code already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, role, departmentId, fingerprintId, status } = req.body;
    const emp = await prisma.employee.updateMany({
      where: { id: req.params.id, companyId: req.companyId },
      data: { name, email, phone, role, departmentId, fingerprintId, status },
    });
    if (!emp.count) return res.status(404).json({ error: 'Employee not found' });
    const updated = await prisma.employee.findUnique({ where: { id: req.params.id }, include: { department: true } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    await prisma.employee.updateMany({
      where: { id: req.params.id, companyId: req.companyId },
      data: { status: 'Inactive' },
    });
    res.json({ message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

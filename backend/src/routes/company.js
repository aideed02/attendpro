const router = require('express').Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.companyId }, include: { departments: true } });
    res.json(company);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/', async (req, res) => {
  try {
    const { name, workStartTime, workEndTime, lateThreshold, workingDays } = req.body;
    const updated = await prisma.company.update({ where: { id: req.companyId }, data: { name, workStartTime, workEndTime, lateThreshold, workingDays } });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/departments', async (req, res) => {
  try {
    const depts = await prisma.department.findMany({ where: { companyId: req.companyId }, include: { _count: { select: { employees: true } } } });
    res.json(depts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/departments', async (req, res) => {
  try {
    const { name } = req.body;
    const dept = await prisma.department.create({ data: { name, companyId: req.companyId } });
    res.status(201).json(dept);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Department already exists' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

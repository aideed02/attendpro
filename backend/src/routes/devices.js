const router = require('express').Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const devices = await prisma.device.findMany({ where: { companyId: req.companyId } });
    res.json(devices);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, location, ipAddress, type } = req.body;
    const device = await prisma.device.create({ data: { name, location, ipAddress, type, companyId: req.companyId } });
    res.status(201).json(device);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const device = await prisma.device.update({ where: { id: req.params.id }, data: req.body });
    res.json(device);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.device.delete({ where: { id: req.params.id } });
    res.json({ message: 'Device removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

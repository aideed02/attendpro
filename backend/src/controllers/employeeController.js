const prisma = require('../config/prisma');

const getAll = async (req, res) => {
  try {
    const { search, departmentId, status } = req.query;
    const employees = await prisma.employee.findMany({
      where: {
        companyId: req.admin.companyId,
        ...(status && { status }),
        ...(departmentId && { departmentId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { employeeCode: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({
      where: { id: req.params.id, companyId: req.admin.companyId },
      include: { department: true, attendance: { orderBy: { date: 'desc' }, take: 30 } },
    });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: emp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, phone, role, departmentId, fingerprintId } = req.body;
    const count = await prisma.employee.count({ where: { companyId: req.admin.companyId } });
    const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

    const emp = await prisma.employee.create({
      data: { name, email, phone, role, departmentId, companyId: req.admin.companyId, fingerprintId, employeeCode },
      include: { department: true },
    });
    res.status(201).json({ success: true, data: emp });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Email or fingerprint ID already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, email, phone, role, departmentId, fingerprintId, status } = req.body;
    const emp = await prisma.employee.updateMany({
      where: { id: req.params.id, companyId: req.admin.companyId },
      data: { name, email, phone, role, departmentId, fingerprintId, status },
    });
    if (!emp.count) return res.status(404).json({ success: false, message: 'Employee not found' });
    const updated = await prisma.employee.findUnique({ where: { id: req.params.id }, include: { department: true } });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.employee.updateMany({
      where: { id: req.params.id, companyId: req.admin.companyId },
      data: { status: 'Inactive' },
    });
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };

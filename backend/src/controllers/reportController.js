const prisma = require('../config/prisma');

const toDate = (d) => new Date(d + 'T00:00:00.000Z');

// GET /api/reports/monthly?year=&month=
const monthly = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    const y = parseInt(year), m = parseInt(month);
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0));

    const records = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        employee: { companyId: req.admin.companyId },
      },
      include: { employee: { include: { department: true } } },
    });

    const employees = await prisma.employee.findMany({
      where: { companyId: req.admin.companyId, status: 'Active' },
      include: { department: true },
    });

    const summary = employees.map(emp => {
      const empRecs = records.filter(r => r.employeeId === emp.id);
      const present = empRecs.filter(r => r.status === 'Present').length;
      const late = empRecs.filter(r => r.status === 'Late').length;
      const absent = empRecs.filter(r => r.status === 'Absent').length;
      const leave = empRecs.filter(r => r.status === 'Leave').length;
      const totalHours = empRecs.reduce((s, r) => s + (r.hours || 0), 0);
      const workingDays = present + late + absent + leave;
      const rate = workingDays > 0 ? Math.round((present + late) / workingDays * 100) : 0;
      return { employee: emp, present, late, absent, leave, totalHours: totalHours.toFixed(1), rate };
    });

    const totals = {
      present: records.filter(r => r.status === 'Present').length,
      late: records.filter(r => r.status === 'Late').length,
      absent: records.filter(r => r.status === 'Absent').length,
      leave: records.filter(r => r.status === 'Leave').length,
    };

    res.json({ success: true, data: { summary, totals, records } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/weekly
const weekly = async (req, res) => {
  try {
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const dateStr = dt.toISOString().split('T')[0];
      const date = toDate(dateStr);
      const recs = await prisma.attendance.findMany({
        where: { date, employee: { companyId: req.admin.companyId } },
      });
      results.push({
        date: dateStr,
        day: dt.toLocaleDateString('en-US', { weekday: 'short' }),
        present: recs.filter(r => r.status === 'Present').length,
        late: recs.filter(r => r.status === 'Late').length,
        absent: recs.filter(r => r.status === 'Absent').length,
      });
    }
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/department
const byDepartment = async (req, res) => {
  try {
    const today = toDate(new Date().toISOString().split('T')[0]);
    const departments = await prisma.department.findMany({
      where: { companyId: req.admin.companyId },
      include: {
        employees: {
          where: { status: 'Active' },
          include: { attendance: { where: { date: today } } },
        },
      },
    });

    const data = departments.map(dept => {
      const total = dept.employees.length;
      const present = dept.employees.filter(e =>
        e.attendance.some(a => a.status === 'Present' || a.status === 'Late')
      ).length;
      return { department: dept.name, total, present, rate: total ? Math.round(present / total * 100) : 0 };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { monthly, weekly, byDepartment };

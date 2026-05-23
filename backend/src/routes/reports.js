const router = require('express').Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/reports/dashboard - today's overview
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const employees = await prisma.employee.findMany({ where: { companyId: req.companyId, status: 'Active' }, include: { department: true } });
    const todayRecords = await prisma.attendance.findMany({
      where: { date: today, employee: { companyId: req.companyId } },
      include: { employee: { include: { department: true } } },
    });

    const total = employees.length;
    const present = todayRecords.filter(r => r.status === 'Present').length;
    const late = todayRecords.filter(r => r.status === 'Late').length;
    const onLeave = todayRecords.filter(r => r.status === 'Leave').length;
    const absent = total - present - late - onLeave;

    // Dept breakdown
    const depts = [...new Set(employees.map(e => e.department.name))];
    const deptStats = depts.map(dept => {
      const deptEmps = employees.filter(e => e.department.name === dept);
      const deptPresent = todayRecords.filter(r => r.employee.department.name === dept && (r.status === 'Present' || r.status === 'Late')).length;
      return { dept, total: deptEmps.length, present: deptPresent, rate: Math.round(deptPresent / deptEmps.length * 100) };
    });

    // Weekly trend (last 7 workdays)
    const weekTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const dow = d.getDay();
      const recs = await prisma.attendance.findMany({ where: { date: d, employee: { companyId: req.companyId } } });
      weekTrend.push({ date: d.toISOString().split('T')[0], day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow], present: recs.filter(r=>r.status!=='Absent').length, absent: recs.filter(r=>r.status==='Absent').length });
    }

    res.json({ total, present, late, absent, onLeave, rate: Math.round((present+late)/total*100), deptStats, weekTrend, recentActivity: todayRecords.slice(0,10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/monthly?year=2026&month=5
router.get('/monthly', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        employee: { companyId: req.companyId },
      },
      include: { employee: { include: { department: true } } },
    });

    const employees = await prisma.employee.findMany({
      where: { companyId: req.companyId, status: 'Active' },
      include: { department: true },
    });

    // Summary per employee
    const summary = employees.map(emp => {
      const empRecs = records.filter(r => r.employeeId === emp.id);
      const present = empRecs.filter(r => r.status === 'Present').length;
      const late = empRecs.filter(r => r.status === 'Late').length;
      const absent = empRecs.filter(r => r.status === 'Absent').length;
      const leave = empRecs.filter(r => r.status === 'Leave').length;
      const totalDays = empRecs.length;
      const rate = totalDays ? Math.round((present + late) / totalDays * 100) : 0;
      const totalHours = empRecs.reduce((s, r) => s + (r.hours || 0), 0);
      return { employee: emp, present, late, absent, leave, rate, totalHours: parseFloat(totalHours.toFixed(1)) };
    });

    // Daily counts for chart
    const dailyCounts = [];
    for (let d = 1; d <= endDate.getDate(); d++) {
      const dt = new Date(year, month - 1, d);
      if (dt.getDay() === 0 || dt.getDay() === 6) continue;
      const dateStr = dt.toISOString().split('T')[0];
      const dayRecs = records.filter(r => r.date.toISOString().split('T')[0] === dateStr);
      dailyCounts.push({ date: dateStr, day: d, present: dayRecs.filter(r=>r.status==='Present').length, late: dayRecs.filter(r=>r.status==='Late').length, absent: dayRecs.filter(r=>r.status==='Absent').length });
    }

    const totals = {
      present: records.filter(r=>r.status==='Present').length,
      late: records.filter(r=>r.status==='Late').length,
      absent: records.filter(r=>r.status==='Absent').length,
      leave: records.filter(r=>r.status==='Leave').length,
    };

    res.json({ summary, dailyCounts, totals, period: { year, month } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

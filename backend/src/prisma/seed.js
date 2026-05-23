const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const company = await prisma.company.upsert({
    where: { id: 'seed-company-001' },
    update: {},
    create: { id: 'seed-company-001', name: 'TechCorp Ltd.', workStartTime: '09:00', workEndTime: '18:00', lateThreshold: 15, workingDays: ['Mon','Tue','Wed','Thu','Fri'] },
  });
  const deptNames = ['Engineering','Design','Marketing','HR','Finance','Operations'];
  const depts = [];
  for (const name of deptNames) {
    const d = await prisma.department.upsert({ where: { name_companyId: { name, companyId: company.id } }, update: {}, create: { name, companyId: company.id } });
    depts.push(d);
  }
  const hashed = await bcrypt.hash('admin123', 12);
  await prisma.admin.upsert({ where: { email: 'admin@techcorp.com' }, update: {}, create: { name: 'Admin User', email: 'admin@techcorp.com', password: hashed, companyId: company.id, role: 'SUPER_ADMIN' } });
  const employees = [
    { name: 'Ahmed Hassan', email: 'ahmed@tc.com', role: 'Lead Engineer', dept: 0, fp: 'FP001' },
    { name: 'Fadumo Ali', email: 'fadumo@tc.com', role: 'UI/UX Designer', dept: 1, fp: 'FP002' },
    { name: 'Mohamed Osman', email: 'mo@tc.com', role: 'Developer', dept: 0, fp: 'FP003' },
    { name: 'Hodan Ibrahim', email: 'hodan@tc.com', role: 'Marketing Manager', dept: 2, fp: 'FP004' },
    { name: 'Abdi Warsame', email: 'abdi@tc.com', role: 'HR Coordinator', dept: 3, fp: 'FP005' },
    { name: 'Nasteho Jama', email: 'nasteho@tc.com', role: 'Financial Analyst', dept: 4, fp: 'FP006' },
    { name: 'Bashir Nur', email: 'bashir@tc.com', role: 'Operations Lead', dept: 5, fp: 'FP007' },
    { name: 'Safia Mohamud', email: 'safia@tc.com', role: 'Engineer', dept: 0, fp: 'FP008' },
  ];
  for (let i = 0; i < employees.length; i++) {
    const e = employees[i];
    await prisma.employee.upsert({ where: { email: e.email }, update: {}, create: { employeeCode: `EMP${String(i+1).padStart(3,'0')}`, name: e.name, email: e.email, role: e.role, departmentId: depts[e.dept].id, companyId: company.id, fingerprintId: e.fp, phone: `+252 61 ${1000000 + i * 1111}` } });
  }
  console.log('Seed complete! Login: admin@techcorp.com / admin123');
}
main().catch(console.error).finally(() => prisma.$disconnect());

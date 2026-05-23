-- ============================================================
-- AttendPro — Seed Data
-- Migration: 002_seed.sql
-- ============================================================

-- Default work schedule
INSERT INTO work_schedule (name, start_time, end_time, late_threshold, is_default, working_days)
VALUES ('Standard (9-6)', '09:00', '18:00', 15, TRUE, '{1,2,3,4,5}');

-- Departments
INSERT INTO departments (id, name, description) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Engineering',  'Software & infrastructure'),
  ('11111111-0002-0001-0001-000000000001', 'Design',       'UI/UX & product design'),
  ('11111111-0003-0001-0001-000000000001', 'Marketing',    'Growth & communications'),
  ('11111111-0004-0001-0001-000000000001', 'HR',           'Human resources'),
  ('11111111-0005-0001-0001-000000000001', 'Finance',      'Accounting & finance'),
  ('11111111-0006-0001-0001-000000000001', 'Operations',   'Day-to-day operations');

-- Admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@attendpro.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGRIVPFByRXxM6y',
   'System Admin', 'admin'),
  ('hr@attendpro.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGRIVPFByRXxM6y',
   'HR Manager', 'hr');

-- Employees (24 records)
INSERT INTO employees (employee_code, full_name, email, phone, department_id, job_title, fingerprint_id, qr_token, hire_date) VALUES
  ('EMP001','Ahmed Hassan',   'ahmed@tc.com',   '+252611234567', '11111111-0001-0001-0001-000000000001', 'Lead Engineer',   'FP001', 'QR-EMP001', '2022-03-01'),
  ('EMP002','Fadumo Ali',     'fadumo@tc.com',  '+252612345678', '11111111-0002-0001-0001-000000000001', 'UI/UX Designer',  'FP002', 'QR-EMP002', '2022-05-15'),
  ('EMP003','Mohamed Osman',  'mo@tc.com',      '+252633456789', '11111111-0001-0001-0001-000000000001', 'Backend Dev',     'FP003', 'QR-EMP003', '2021-11-01'),
  ('EMP004','Hodan Ibrahim',  'hodan@tc.com',   '+252614567890', '11111111-0003-0001-0001-000000000001', 'Marketing Mgr',   'FP004', 'QR-EMP004', '2020-08-20'),
  ('EMP005','Abdi Warsame',   'abdi@tc.com',    '+252655678901', '11111111-0004-0001-0001-000000000001', 'HR Coordinator',  'FP005', 'QR-EMP005', '2023-01-10'),
  ('EMP006','Nasteho Jama',   'nasteho@tc.com', '+252616789012', '11111111-0005-0001-0001-000000000001', 'Finance Analyst', 'FP006', 'QR-EMP006', '2021-06-01'),
  ('EMP007','Bashir Nur',     'bashir@tc.com',  '+252637890123', '11111111-0006-0001-0001-000000000001', 'Ops Lead',        'FP007', 'QR-EMP007', '2020-02-15'),
  ('EMP008','Safia Mohamud',  'safia@tc.com',   '+252618901234', '11111111-0001-0001-0001-000000000001', 'Frontend Dev',    'FP008', 'QR-EMP008', '2022-09-01'),
  ('EMP009','Daud Sheikh',    'daud@tc.com',    '+252659012345', '11111111-0002-0001-0001-000000000001', 'Graphic Designer','FP009', 'QR-EMP009', '2023-03-20'),
  ('EMP010','Liban Aden',     'liban@tc.com',   '+252610123456', '11111111-0003-0001-0001-000000000001', 'SEO Analyst',     'FP010', 'QR-EMP010', '2022-07-11'),
  ('EMP011','Omar Ahmed',     'omar@tc.com',    '+252611111111', '11111111-0001-0001-0001-000000000001', 'DevOps Engineer', 'FP011', 'QR-EMP011', '2021-04-05'),
  ('EMP012','Hawa Hassan',    'hawa@tc.com',    '+252612222222', '11111111-0004-0001-0001-000000000001', 'HR Specialist',   'FP012', 'QR-EMP012', '2022-10-01'),
  ('EMP013','Yusuf Ali',      'yusuf@tc.com',   '+252613333333', '11111111-0005-0001-0001-000000000001', 'Accountant',      'FP013', 'QR-EMP013', '2020-12-01'),
  ('EMP014','Amina Osman',    'amina@tc.com',   '+252614444444', '11111111-0006-0001-0001-000000000001', 'Ops Coordinator', 'FP014', 'QR-EMP014', '2023-02-14'),
  ('EMP015','Jamal Ibrahim',  'jamal@tc.com',   '+252615555555', '11111111-0001-0001-0001-000000000001', 'Mobile Dev',      'FP015', 'QR-EMP015', '2022-01-03'),
  ('EMP016','Rahma Warsame',  'rahma@tc.com',   '+252616666666', '11111111-0002-0001-0001-000000000001', 'Product Designer','FP016', 'QR-EMP016', '2021-08-20'),
  ('EMP017','Khalid Jama',    'khalid@tc.com',  '+252617777777', '11111111-0003-0001-0001-000000000001', 'Content Writer',  'FP017', 'QR-EMP017', '2023-05-01'),
  ('EMP018','Suad Nur',       'suad@tc.com',    '+252618888888', '11111111-0005-0001-0001-000000000001', 'Finance Manager', 'FP018', 'QR-EMP018', '2019-11-15'),
  ('EMP019','Cabdi Mohamud',  'cabdi@tc.com',   '+252619999999', '11111111-0001-0001-0001-000000000001', 'QA Engineer',     'FP019', 'QR-EMP019', '2022-06-01'),
  ('EMP020','Filsan Ahmed',   'filsan@tc.com',  '+252610000000', '11111111-0004-0001-0001-000000000001', 'Recruiter',       'FP020', 'QR-EMP020', '2023-04-10'),
  ('EMP021','Mukhtar Ali',    'mukhtar@tc.com', '+252611100001', '11111111-0006-0001-0001-000000000001', 'Logistics Coord', 'FP021', 'QR-EMP021', '2021-09-01'),
  ('EMP022','Ifrah Osman',    'ifrah@tc.com',   '+252612200002', '11111111-0002-0001-0001-000000000001', 'Motion Designer', 'FP022', 'QR-EMP022', '2022-12-05'),
  ('EMP023','Hassan Ibrahim', 'hassan@tc.com',  '+252613300003', '11111111-0003-0001-0001-000000000001', 'Brand Manager',   'FP023', 'QR-EMP023', '2020-05-22'),
  ('EMP024','Nimco Warsame',  'nimco@tc.com',   '+252614400004', '11111111-0001-0001-0001-000000000001', 'Data Engineer',   'FP024', 'QR-EMP024', '2023-07-01');

-- Generate 30 days of attendance history
DO $$
DECLARE
  emp RECORD;
  d   DATE;
  dow INT;
  ci  TIMESTAMPTZ;
  co  TIMESTAMPTZ;
  st  VARCHAR(20);
  mth VARCHAR(30);
  rand_h INT;
  rand_m INT;
BEGIN
  FOR d IN SELECT generate_series(CURRENT_DATE - 29, CURRENT_DATE - 1, '1 day'::INTERVAL)::DATE LOOP
    dow := EXTRACT(DOW FROM d);
    CONTINUE WHEN dow = 0 OR dow = 6; -- skip weekends

    FOR emp IN SELECT id FROM employees WHERE status = 'active' LOOP
      rand_h := 8 + (RANDOM() * 2)::INT;
      rand_m := (RANDOM() * 59)::INT;

      -- Randomise status: 70% present, 15% late, 10% absent, 5% leave
      CASE
        WHEN RANDOM() < 0.70 THEN st := 'present'; rand_h := 8; rand_m := 30 + (RANDOM()*29)::INT;
        WHEN RANDOM() < 0.85 THEN st := 'late';    rand_h := 9; rand_m := 20 + (RANDOM()*39)::INT;
        WHEN RANDOM() < 0.95 THEN st := 'absent';
        ELSE                      st := 'leave';
      END CASE;

      IF st IN ('present','late') THEN
        ci := (d + TIME '00:00') + (rand_h * INTERVAL '1 hour') + (rand_m * INTERVAL '1 minute');
        co := ci + INTERVAL '8 hours' + ((RANDOM()*60)::INT * INTERVAL '1 minute');
        mth := CASE (RANDOM()*2)::INT WHEN 0 THEN 'fingerprint' WHEN 1 THEN 'qr' ELSE 'manual' END;
      ELSE
        ci := NULL; co := NULL; mth := NULL;
      END IF;

      INSERT INTO attendance (employee_id, work_date, check_in, check_out, status, check_in_method, check_out_method)
      VALUES (emp.id, d, ci, co, st, mth, mth)
      ON CONFLICT (employee_id, work_date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

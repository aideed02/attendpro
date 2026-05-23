-- ============================================================
-- AttendPro — Database Schema
-- Migration: 001_init.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── DEPARTMENTS ─────────────────────────────────────────────
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USERS (admin/HR accounts) ───────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  role          VARCHAR(30)  NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('admin', 'hr', 'viewer')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EMPLOYEES ───────────────────────────────────────────────
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code   VARCHAR(20)  NOT NULL UNIQUE,   -- e.g. EMP001
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(255) UNIQUE,
  phone           VARCHAR(30),
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  job_title       VARCHAR(100),
  fingerprint_id  VARCHAR(50)  UNIQUE,             -- biometric device ID
  qr_token        VARCHAR(100) UNIQUE,             -- QR code token
  avatar_url      TEXT,
  hire_date       DATE,
  status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ATTENDANCE RECORDS ──────────────────────────────────────
CREATE TABLE attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date     DATE NOT NULL,
  check_in      TIMESTAMPTZ,
  check_out     TIMESTAMPTZ,
  hours_worked  NUMERIC(4,2) GENERATED ALWAYS AS (
    CASE
      WHEN check_in IS NOT NULL AND check_out IS NOT NULL
      THEN ROUND(EXTRACT(EPOCH FROM (check_out - check_in)) / 3600, 2)
      ELSE 0
    END
  ) STORED,
  status        VARCHAR(20)  NOT NULL DEFAULT 'absent'
                  CHECK (status IN ('present','late','absent','leave','half_day')),
  check_in_method   VARCHAR(30) CHECK (check_in_method IN ('fingerprint','qr','manual','face')),
  check_out_method  VARCHAR(30) CHECK (check_out_method IN ('fingerprint','qr','manual','face')),
  remarks       TEXT,
  recorded_by   UUID REFERENCES users(id) ON DELETE SET NULL, -- for manual entry
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, work_date)
);

-- ─── LEAVE REQUESTS ──────────────────────────────────────────
CREATE TABLE leave_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type    VARCHAR(30) NOT NULL CHECK (leave_type IN ('sick','annual','emergency','unpaid','other')),
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  reason        TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WORK SCHEDULE ───────────────────────────────────────────
CREATE TABLE work_schedule (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  start_time      TIME NOT NULL DEFAULT '09:00',
  end_time        TIME NOT NULL DEFAULT '18:00',
  late_threshold  INT  NOT NULL DEFAULT 15,  -- minutes after start_time
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  working_days    INT[] NOT NULL DEFAULT '{1,2,3,4,5}' -- 0=Sun..6=Sat
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info','warning','success','error')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AUDIT LOG ───────────────────────────────────────────────
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  table_name  VARCHAR(50),
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_work_date   ON attendance(work_date);
CREATE INDEX idx_attendance_status      ON attendance(status);
CREATE INDEX idx_employees_department   ON employees(department_id);
CREATE INDEX idx_employees_status       ON employees(status);
CREATE INDEX idx_leave_employee         ON leave_requests(employee_id);
CREATE INDEX idx_audit_user             ON audit_log(user_id);
CREATE INDEX idx_audit_created          ON audit_log(created_at DESC);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── MONTHLY SUMMARY VIEW ────────────────────────────────────
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
  e.id              AS employee_id,
  e.employee_code,
  e.full_name,
  d.name            AS department,
  DATE_TRUNC('month', a.work_date) AS month,
  COUNT(*)          AS total_records,
  COUNT(*) FILTER (WHERE a.status = 'present')   AS present_days,
  COUNT(*) FILTER (WHERE a.status = 'late')      AS late_days,
  COUNT(*) FILTER (WHERE a.status = 'absent')    AS absent_days,
  COUNT(*) FILTER (WHERE a.status = 'leave')     AS leave_days,
  COALESCE(SUM(a.hours_worked), 0)               AS total_hours,
  ROUND(
    (COUNT(*) FILTER (WHERE a.status IN ('present','late'))::NUMERIC /
     NULLIF(COUNT(*), 0)) * 100, 1
  )                 AS attendance_rate
FROM attendance a
JOIN employees e ON e.id = a.employee_id
LEFT JOIN departments d ON d.id = e.department_id
GROUP BY e.id, e.employee_code, e.full_name, d.name, DATE_TRUNC('month', a.work_date);

-- ─── TODAY SUMMARY VIEW ──────────────────────────────────────
CREATE OR REPLACE VIEW v_today_attendance AS
SELECT
  e.id              AS employee_id,
  e.employee_code,
  e.full_name,
  d.name            AS department,
  e.job_title,
  a.work_date,
  a.check_in,
  a.check_out,
  a.hours_worked,
  a.status,
  a.check_in_method,
  a.check_out_method,
  a.remarks
FROM employees e
LEFT JOIN attendance a ON a.employee_id = e.id AND a.work_date = CURRENT_DATE
LEFT JOIN departments d ON d.id = e.department_id
WHERE e.status = 'active'
ORDER BY e.full_name;

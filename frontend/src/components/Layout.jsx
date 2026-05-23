import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const NAV = [
  { to: '/dashboard',  icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { to: '/checkin',    icon: 'ti-fingerprint',       label: 'Check In/Out' },
  { to: '/employees',  icon: 'ti-users',             label: 'Employees' },
  { to: '/attendance', icon: 'ti-calendar-check',    label: 'Attendance' },
  { to: '/reports',    icon: 'ti-chart-bar',         label: 'Reports' },
  { to: '/settings',   icon: 'ti-settings',          label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>📊</div>
          <div>
            <div className={styles.logoText}>AttendPro</div>
            <div className={styles.logoSub}>Attendance System</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <i className={`ti ${icon}`} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <div className={styles.userName}>{user?.fullName}</div>
              <div className={styles.userRole}>{user?.role}</div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
              <i className="ti ti-logout" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

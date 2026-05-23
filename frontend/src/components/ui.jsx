import { useState } from 'react';

/* ─── Button ─────────────────────────────────────────────── */
export function Btn({ children, variant = 'ghost', size = 'md', className = '', ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 8, fontFamily: 'var(--font)',
    fontWeight: 500, cursor: 'pointer', transition: 'all .15s',
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '5px 10px' : '8px 16px',
  };
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost:   { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' },
    danger:  { background: 'rgba(247,85,79,.12)', color: 'var(--danger)', border: '1px solid rgba(247,85,79,.3)' },
    success: { background: 'rgba(46,204,138,.12)', color: 'var(--accent3)', border: '1px solid rgba(46,204,138,.3)' },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} {...props}>
      {children}
    </button>
  );
}

/* ─── Card ───────────────────────────────────────────────── */
export function Card({ children, style = {}, ...props }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      ...style
    }} {...props}>
      {children}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────── */
export function StatCard({ label, value, color = 'var(--text)', icon, change }) {
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 14, color }} aria-hidden="true" />}
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--mono)', color, letterSpacing: '-1px' }}>{value}</div>
      {change && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{change}</div>}
    </Card>
  );
}

/* ─── Badge ──────────────────────────────────────────────── */
const BADGE_COLORS = {
  present: { bg: 'rgba(46,204,138,.12)',  color: 'var(--accent3)' },
  late:    { bg: 'rgba(247,183,49,.12)',  color: 'var(--warn)' },
  absent:  { bg: 'rgba(247,85,79,.12)',   color: 'var(--danger)' },
  leave:   { bg: 'rgba(124,111,247,.12)', color: 'var(--accent2)' },
  half_day:{ bg: 'rgba(79,142,247,.12)', color: 'var(--accent)' },
  active:  { bg: 'rgba(46,204,138,.12)',  color: 'var(--accent3)' },
  inactive:{ bg: 'rgba(247,183,49,.12)',  color: 'var(--warn)' },
  terminated:{ bg: 'rgba(247,85,79,.12)', color: 'var(--danger)' },
};
export function Badge({ status }) {
  const s = status?.toLowerCase() || 'absent';
  const c = BADGE_COLORS[s] || { bg: 'rgba(92,103,133,.12)', color: 'var(--text3)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap',
      background: c.bg, color: c.color
    }}>
      {status}
    </span>
  );
}

/* ─── Input ──────────────────────────────────────────────── */
export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>{label}</label>}
      <input style={{
        width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13,
        outline: 'none', fontFamily: 'var(--font)', transition: 'border .15s'
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
      {...props} />
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────── */
export function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>{label}</label>}
      <select style={{
        width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13,
        outline: 'none', fontFamily: 'var(--font)'
      }} {...props}>
        {children}
      </select>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────── */
export function Modal({ title, open, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 16, width: 520, maxWidth: '90vw',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
          <Btn variant="ghost" size="sm" onClick={onClose} style={{ padding: '5px 8px' }}>
            <i className="ti ti-x" aria-hidden="true" />
          </Btn>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ─── Page Header ────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────── */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const Toast = () => (
    <div style={{ position: 'fixed', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--bg2)', border: `1px solid ${t.type === 'error' ? 'rgba(247,85,79,.4)' : 'rgba(46,204,138,.4)'}`,
          borderRadius: 10, padding: '12px 16px', fontSize: 13,
          color: t.type === 'error' ? 'var(--danger)' : 'var(--accent3)',
          boxShadow: '0 4px 20px rgba(0,0,0,.3)', animation: 'slideIn .2s ease',
          maxWidth: 280
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
  return { show, Toast };
}

/* ─── Empty State ────────────────────────────────────────── */
export function Empty({ icon = 'ti-inbox', message = 'No data found' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true" />
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  );
}

/* ─── Loading ────────────────────────────────────────────── */
export function Loading() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
      Loading…
    </div>
  );
}

/* ─── Progress Bar ───────────────────────────────────────── */
export function ProgressBar({ value, color = 'var(--accent)', height = 6 }) {
  return (
    <div style={{ background: 'var(--bg4)', borderRadius: 4, height, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, borderRadius: 4, transition: 'width .6s ease' }} />
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/', icon: 'layout-dashboard', label: 'Dashboard', end: true },
  { to: '/checkin', icon: 'fingerprint', label: 'Check In/Out' },
  { to: '/employees', icon: 'users', label: 'Employees' },
  { to: '/attendance', icon: 'calendar-check', label: 'Attendance' },
  { to: '/reports', icon: 'chart-bar', label: 'Reports' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const initials = admin?.name?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'AD';

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
      <aside style={{width:220,flexShrink:0,background:'#161b27',borderRight:'1px solid #2a3350',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'20px',borderBottom:'1px solid #2a3350',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#4f8ef7,#7c6ff7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📊</div>
          <div>
            <div style={{fontWeight:600,fontSize:15}}>AttendPro</div>
            <div style={{fontSize:10,color:'#5c6785',fontFamily:'Space Mono',letterSpacing:1,textTransform:'uppercase'}}>v2.0</div>
          </div>
        </div>
        <nav style={{flex:1,padding:'12px 0',overflowY:'auto'}}>
          {NAV.map(({to,icon,label,end})=>(
            <NavLink key={to} to={to} end={end} style={({isActive})=>({
              display:'flex',alignItems:'center',gap:10,padding:'9px 20px',
              color:isActive?'#4f8ef7':'#8892b0',fontSize:13.5,textDecoration:'none',
              background:isActive?'rgba(79,142,247,0.08)':'transparent',
              borderLeft:isActive?'3px solid #4f8ef7':'3px solid transparent',transition:'all .15s'
            })}>
              <i className={`ti ti-${icon}`} style={{fontSize:17}} />{label}
            </NavLink>
          ))}
        </nav>
        <div style={{padding:'12px 16px',borderTop:'1px solid #2a3350'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,background:'#1e2538',borderRadius:8,padding:10}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#4f8ef7,#7c6ff7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,flexShrink:0}}>{initials}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{admin?.name}</div>
              <div style={{fontSize:11,color:'#5c6785',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{admin?.company?.name}</div>
            </div>
            <button onClick={()=>{logout();navigate('/login');}} style={{background:'none',border:'none',color:'#5c6785',cursor:'pointer',padding:4}} title="Logout">
              <i className="ti ti-logout" style={{fontSize:16}} />
            </button>
          </div>
        </div>
      </aside>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#0f1117'}}>
        <div style={{flex:1,overflowY:'auto',padding:28}}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

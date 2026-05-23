import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const inp = {width:'100%',background:'#1e2538',border:'1px solid #2a3350',borderRadius:8,padding:'9px 12px',color:'#e8eaf6',fontSize:13,fontFamily:'DM Sans',outline:'none'};
const lbl = {display:'block',fontSize:11,color:'#8892b0',marginBottom:5,textTransform:'uppercase',letterSpacing:.5,marginTop:14};

export default function SettingsPage() {
  const [company, setCompany] = useState(null);
  const [devices, setDevices] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [saving, setSaving] = useState(false);
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  useEffect(() => {
    api.get('/company').then(r => setCompany(r.data.data)).catch(()=>{});
    api.get('/devices').then(r => setDevices(r.data.data)).catch(()=>{});
  }, []);

  const toggleDay = (day) => {
    if (!company) return;
    const wd = company.workingDays.includes(day)
      ? company.workingDays.filter(d => d !== day)
      : [...company.workingDays, day];
    setCompany({ ...company, workingDays: wd });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/company', {
        name: company.name, workStartTime: company.workStartTime,
        workEndTime: company.workEndTime, lateThreshold: company.lateThreshold,
        workingDays: company.workingDays,
      });
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const addDept = async () => {
    if (!newDept.trim()) return;
    try {
      const r = await api.post('/company/departments', { name: newDept });
      setCompany(c => ({ ...c, departments: [...(c.departments||[]), r.data.data] }));
      setNewDept('');
      toast.success('Department added');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const toggleDevice = async (device) => {
    const newStatus = device.status === 'Online' ? 'Offline' : 'Online';
    await api.put(`/devices/${device.id}`, { status: newStatus });
    setDevices(ds => ds.map(d => d.id === device.id ? {...d, status: newStatus} : d));
  };

  if (!company) return <div style={{color:'#5c6785',padding:40,textAlign:'center'}}>Loading settings...</div>;

  return (
    <div>
      <div style={{marginBottom:24}}><h1 style={{fontSize:20,fontWeight:600}}>Settings</h1><p style={{color:'#8892b0',fontSize:13,marginTop:2}}>Configure your company preferences</p></div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        {/* Company Settings */}
        <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:24}}>
          <div style={{fontSize:14,fontWeight:500,display:'flex',alignItems:'center',gap:8,marginBottom:20,color:'#8892b0'}}>
            <i className="ti ti-building" style={{color:'#4f8ef7'}} />Company Settings
          </div>
          <label style={lbl}>Company Name</label>
          <input style={inp} value={company.name} onChange={e=>setCompany({...company,name:e.target.value})} />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label style={lbl}>Work Start Time</label><input type="time" style={inp} value={company.workStartTime} onChange={e=>setCompany({...company,workStartTime:e.target.value})} /></div>
            <div><label style={lbl}>Work End Time</label><input type="time" style={inp} value={company.workEndTime} onChange={e=>setCompany({...company,workEndTime:e.target.value})} /></div>
          </div>
          <label style={lbl}>Late Threshold (minutes)</label>
          <input type="number" style={inp} value={company.lateThreshold} onChange={e=>setCompany({...company,lateThreshold:parseInt(e.target.value)})} />
          <label style={lbl}>Working Days</label>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:6}}>
            {DAYS.map(d => {
              const active = company.workingDays?.includes(d);
              return (
                <button key={d} onClick={()=>toggleDay(d)} style={{background:active?'rgba(46,204,138,.12)':'rgba(92,103,133,.1)',color:active?'#2ecc8a':'#5c6785',border:`1px solid ${active?'rgba(46,204,138,.3)':'rgba(92,103,133,.2)'}`,borderRadius:20,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:500,fontFamily:'DM Sans',transition:'all .15s'}}>
                  {d}
                </button>
              );
            })}
          </div>
          <button onClick={save} disabled={saving} style={{marginTop:20,background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans',display:'flex',alignItems:'center',gap:6,width:'100%',justifyContent:'center'}}>
            <i className="ti ti-check" />{saving?'Saving...':'Save Settings'}
          </button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          {/* Departments */}
          <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:24}}>
            <div style={{fontSize:14,fontWeight:500,display:'flex',alignItems:'center',gap:8,marginBottom:16,color:'#8892b0'}}>
              <i className="ti ti-sitemap" style={{color:'#4f8ef7'}} />Departments
            </div>
            <div style={{maxHeight:160,overflowY:'auto',marginBottom:12}}>
              {company.departments?.map((d,i)=>(
                <div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:i<company.departments.length-1?'1px solid rgba(42,51,80,.5)':'none'}}>
                  <span style={{fontSize:13}}>{d.name}</span>
                  <span style={{fontSize:11,fontFamily:'Space Mono',color:'#5c6785'}}>DEPT</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <input value={newDept} onChange={e=>setNewDept(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addDept()} placeholder="New department name..." style={{...inp,flex:1}} />
              <button onClick={addDept} style={{background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontFamily:'DM Sans',fontSize:13,flexShrink:0}}>Add</button>
            </div>
          </div>

          {/* Devices */}
          <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:24,flex:1}}>
            <div style={{fontSize:14,fontWeight:500,display:'flex',alignItems:'center',gap:8,marginBottom:16,color:'#8892b0'}}>
              <i className="ti ti-fingerprint" style={{color:'#4f8ef7'}} />Biometric Devices
            </div>
            {devices.length === 0 && (
              <div style={{color:'#5c6785',fontSize:13,textAlign:'center',padding:'20px 0'}}>No devices configured</div>
            )}
            {devices.map((d,i)=>(
              <div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:i<devices.length-1?'1px solid rgba(42,51,80,.5)':'none'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{d.name}</div>
                  <div style={{fontSize:11,color:'#5c6785',marginTop:2}}>{d.location} · {d.ipAddress}</div>
                </div>
                <button onClick={()=>toggleDevice(d)} style={{background:d.status==='Online'?'rgba(46,204,138,.12)':'rgba(247,85,79,.12)',color:d.status==='Online'?'#2ecc8a':'#f7554f',border:`1px solid ${d.status==='Online'?'rgba(46,204,138,.3)':'rgba(247,85,79,.3)'}`,borderRadius:20,padding:'3px 12px',cursor:'pointer',fontSize:11.5,fontWeight:500,fontFamily:'DM Sans'}}>
                  {d.status}
                </button>
              </div>
            ))}
            <button onClick={()=>toast.success('Pinging devices...')} style={{marginTop:12,width:'100%',background:'none',border:'1px solid #2a3350',borderRadius:8,padding:'8px',fontSize:13,color:'#8892b0',cursor:'pointer',fontFamily:'DM Sans',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <i className="ti ti-wifi" />Test All Connections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

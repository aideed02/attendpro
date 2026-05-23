import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function CheckInPage() {
  const [method, setMethod] = useState('fp');
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [scanState, setScanState] = useState('idle'); // idle, scanning, verified
  const [todayLog, setTodayLog] = useState([]);
  const [qrData, setQrData] = useState(null);
  const [clock, setClock] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data.data)).catch(() => {});
    refreshLog();
    const tick = setInterval(() => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}));
      setDate(now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const refreshLog = () => {
    api.get('/attendance/today-summary').then(r => setTodayLog(r.data.data.records || [])).catch(() => {});
  };

  const startScan = () => {
    if (!selectedEmp) { toast.error('Select an employee first'); return; }
    setScanState('scanning');
    setTimeout(() => { setScanState('verified'); toast.success('Fingerprint verified!'); setTimeout(() => setScanState('idle'), 4000); }, 2000);
  };

  const doCheckIn = async () => {
    if (!selectedEmp) { toast.error('Select an employee first'); return; }
    try {
      await api.post('/attendance/checkin', { employeeId: selectedEmp, method: method==='fp'?'Fingerprint':'QR Code' });
      toast.success('Check-in recorded!');
      refreshLog();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const doCheckOut = async () => {
    if (!selectedEmp) { toast.error('Select an employee first'); return; }
    try {
      await api.post('/attendance/checkout', { employeeId: selectedEmp, method: method==='fp'?'Fingerprint':'QR Code' });
      toast.success('Check-out recorded!');
      refreshLog();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const generateQR = async () => {
    if (!selectedEmp) { toast.error('Select an employee first'); return; }
    try {
      const r = await api.post(`/qr/generate/${selectedEmp}`);
      setQrData(r.data.data);
    } catch (err) { toast.error('Failed to generate QR'); }
  };

  const chip = (s) => {
    const cfg = {Present:{bg:'rgba(46,204,138,.12)',c:'#2ecc8a'},Late:{bg:'rgba(247,183,49,.12)',c:'#f7b731'},Absent:{bg:'rgba(247,85,79,.12)',c:'#f7554f'},Leave:{bg:'rgba(124,111,247,.12)',c:'#7c6ff7'}};
    const {bg,c} = cfg[s] || {bg:'rgba(92,103,133,.12)',c:'#5c6785'};
    return <span style={{background:bg,color:c,padding:'3px 10px',borderRadius:20,fontSize:11.5,fontWeight:500}}>{s}</span>;
  };

  const scanColor = scanState==='scanning'?'#4f8ef7':scanState==='verified'?'#2ecc8a':'#3a4468';
  const scanAnim = scanState==='scanning'?'pulse 1.2s ease-in-out infinite':'none';

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(79,142,247,.4)}50%{box-shadow:0 0 0 14px rgba(79,142,247,0)}}`}</style>
      <div style={{marginBottom:20}}><h1 style={{fontSize:20,fontWeight:600}}>Check In / Out</h1><p style={{color:'#8892b0',fontSize:13,marginTop:2}}>Biometric & QR attendance recording</p></div>

      <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:28,textAlign:'center',marginBottom:20}}>
        <div style={{fontSize:11,color:'#5c6785',textTransform:'uppercase',letterSpacing:1}}>Live Clock</div>
        <div style={{fontFamily:'Space Mono',fontSize:48,fontWeight:700,letterSpacing:2,margin:'8px 0'}}>{clock}</div>
        <div style={{fontSize:13,color:'#5c6785',marginBottom:24}}>{date}</div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:460,margin:'0 auto 24px'}}>
          {[['fp','🖐️','Fingerprint','Biometric scanner'],['qr','📱','QR Code','Scan with phone']].map(([k,icon,title,sub])=>(
            <div key={k} onClick={()=>setMethod(k)} style={{background:'#1e2538',border:`2px solid ${method===k?'#4f8ef7':'#2a3350'}`,borderRadius:12,padding:20,cursor:'pointer',transition:'all .2s',transform:method===k?'translateY(-2px)':'none'}}>
              <div style={{fontSize:32,marginBottom:10}}>{icon}</div>
              <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{title}</div>
              <div style={{fontSize:11,color:'#5c6785'}}>{sub}</div>
            </div>
          ))}
        </div>

        <select value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)} style={{maxWidth:280,width:'100%',background:'#1e2538',border:'1px solid #2a3350',borderRadius:8,padding:'9px 12px',color:'#e8eaf6',fontSize:13,fontFamily:'DM Sans',outline:'none',marginBottom:20,display:'block',margin:'0 auto 20px'}}>
          <option value="">-- Select Employee --</option>
          {employees.map(e=><option key={e.id} value={e.id}>{e.name} ({e.department?.name})</option>)}
        </select>

        {method==='fp' && (
          <>
            <div onClick={startScan} style={{width:120,height:120,borderRadius:'50%',background:'#1e2538',border:`3px solid ${scanColor}`,margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',animation:scanAnim,transition:'border-color .3s'}}>
              <i className="ti ti-fingerprint" style={{fontSize:48,color:scanColor}} />
            </div>
            <div style={{fontSize:13,color:'#5c6785',marginBottom:16}}>
              {scanState==='idle'?'Click to scan fingerprint':scanState==='scanning'?'Scanning... hold steady':'✓ Fingerprint verified'}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={doCheckIn} style={{background:'rgba(46,204,138,.15)',color:'#2ecc8a',border:'1px solid rgba(46,204,138,.3)',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans',display:'flex',alignItems:'center',gap:6}}>
                <i className="ti ti-login" />Check In
              </button>
              <button onClick={doCheckOut} style={{background:'rgba(247,85,79,.15)',color:'#f7554f',border:'1px solid rgba(247,85,79,.3)',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans',display:'flex',alignItems:'center',gap:6}}>
                <i className="ti ti-logout" />Check Out
              </button>
            </div>
          </>
        )}

        {method==='qr' && (
          <>
            {qrData ? (
              <>
                <div style={{background:'#fff',padding:12,borderRadius:8,display:'inline-block',margin:'0 auto 12px'}}>
                  <QRCodeSVG value={qrData.url} size={160} />
                </div>
                <div style={{fontSize:11,fontFamily:'Space Mono',color:'#5c6785',marginBottom:12}}>
                  Expires: {new Date(qrData.expiresAt).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div style={{height:184,display:'flex',alignItems:'center',justifyContent:'center',color:'#5c6785',fontSize:13,marginBottom:12}}>
                Select an employee and generate QR code
              </div>
            )}
            <button onClick={generateQR} style={{background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans',display:'inline-flex',alignItems:'center',gap:6}}>
              <i className="ti ti-qrcode" />Generate QR Code
            </button>
          </>
        )}
      </div>

      <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid #2a3350',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:500}}>Today's Log</div>
          <button onClick={refreshLog} style={{background:'none',border:'1px solid #2a3350',borderRadius:6,padding:'5px 10px',color:'#8892b0',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:4}}>
            <i className="ti ti-refresh" />Refresh
          </button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:'1px solid #2a3350'}}>
              {['Employee','Department','Check In','Check Out','Status','Method'].map(h=>(
                <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,color:'#5c6785',textTransform:'uppercase',letterSpacing:.8,fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {todayLog.map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid rgba(42,51,80,.5)'}}>
                  <td style={{padding:'12px 16px',fontWeight:500}}>{r.employee?.name}</td>
                  <td style={{padding:'12px 16px',color:'#8892b0',fontSize:13}}>{r.employee?.department?.name}</td>
                  <td style={{padding:'12px 16px',fontFamily:'Space Mono',fontSize:12}}>{r.checkIn?new Date(r.checkIn).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
                  <td style={{padding:'12px 16px',fontFamily:'Space Mono',fontSize:12}}>{r.checkOut?new Date(r.checkOut).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
                  <td style={{padding:'12px 16px'}}>{chip(r.status)}</td>
                  <td style={{padding:'12px 16px',fontSize:12,color:'#5c6785'}}>{r.method||'Manual'}</td>
                </tr>
              ))}
              {!todayLog.length && <tr><td colSpan={6} style={{padding:32,textAlign:'center',color:'#5c6785',fontSize:13}}>No records today</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

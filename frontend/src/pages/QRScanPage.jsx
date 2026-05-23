import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function QRScanPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [employee, setEmployee] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); setMessage('No token provided'); return; }
    api.post('/qr/scan', { token })
      .then(r => {
        setState('success');
        setEmployee(r.data.data.employee);
        setTime(new Date(r.data.data.checkIn).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}));
        setMessage(`Checked in as ${r.data.data.status}`);
      })
      .catch(err => { setState('error'); setMessage(err.response?.data?.message || 'Scan failed'); });
  }, [token]);

  return (
    <div style={{minHeight:'100vh',background:'#0f1117',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:20,padding:40,textAlign:'center',maxWidth:360,width:'100%'}}>
        <div style={{fontSize:56,marginBottom:16}}>
          {state==='loading'?'⏳':state==='success'?'✅':'❌'}
        </div>
        <h2 style={{fontSize:20,fontWeight:600,marginBottom:8}}>
          {state==='loading'?'Processing...':state==='success'?'Check-In Successful':'Check-In Failed'}
        </h2>
        {state==='success' && (
          <>
            <div style={{fontSize:28,fontWeight:700,fontFamily:'Space Mono',color:'#2ecc8a',margin:'16px 0'}}>{time}</div>
            <div style={{fontSize:15,color:'#8892b0'}}>{employee}</div>
          </>
        )}
        <div style={{fontSize:13,color:'#5c6785',marginTop:12}}>{message}</div>
        {state!=='loading' && (
          <button onClick={()=>window.close()} style={{marginTop:24,background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'10px 28px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans'}}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

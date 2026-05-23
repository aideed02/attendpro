import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const chip = (s) => {
  const cfg = {Present:{bg:'rgba(46,204,138,.12)',c:'#2ecc8a'},Late:{bg:'rgba(247,183,49,.12)',c:'#f7b731'},Absent:{bg:'rgba(247,85,79,.12)',c:'#f7554f'},Leave:{bg:'rgba(124,111,247,.12)',c:'#7c6ff7'}};
  const {bg,c} = cfg[s]||{bg:'rgba(92,103,133,.12)',c:'#5c6785'};
  return <span style={{background:bg,color:c,padding:'3px 10px',borderRadius:20,fontSize:11.5,fontWeight:500}}>{s}</span>;
};

const inp = {background:'#1e2538',border:'1px solid #2a3350',borderRadius:8,padding:'8px 12px',color:'#e8eaf6',fontSize:13,fontFamily:'DM Sans',outline:'none'};

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ date: new Date().toISOString().split('T')[0], departmentId:'', status:'' });
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [manualForm, setManualForm] = useState({ employeeId:'', date: new Date().toISOString().split('T')[0], checkIn:'09:00', checkOut:'18:00', status:'Present', notes:'' });

  useEffect(() => {
    api.get('/company').then(r => setDepartments(r.data.data?.departments || []));
    api.get('/employees').then(r => setEmployees(r.data.data));
  }, []);

  useEffect(() => { load(); }, [filters, page]);

  const load = () => {
    const q = new URLSearchParams({ ...filters, page, limit: 50 });
    api.get(`/attendance?${q}`).then(r => { setRecords(r.data.data); setTotal(r.data.total); }).catch(() => {});
  };

  const setF = (k, v) => { setFilters(f => ({...f,[k]:v})); setPage(1); };

  const exportCSV = () => {
    const headers = ['Date','Employee','Department','Check In','Check Out','Hours','Status'];
    const rows = records.map(r => [
      r.date?.split('T')[0], r.employee?.name, r.employee?.department?.name,
      r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '',
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '',
      r.hours || '', r.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `attendance-${filters.date||'all'}.csv`;
    a.click();
    toast.success('Exported!');
  };

  const submitManual = async () => {
    try {
      await api.post('/attendance/manual', manualForm);
      toast.success('Attendance recorded');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div><h1 style={{fontSize:20,fontWeight:600}}>Attendance Records</h1><p style={{color:'#8892b0',fontSize:13,marginTop:2}}>Daily attendance tracking</p></div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={exportCSV} style={{background:'none',border:'1px solid #3a4468',borderRadius:8,padding:'8px 14px',color:'#8892b0',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',gap:6}}>
            <i className="ti ti-download" />Export CSV
          </button>
          <button onClick={()=>setModal(true)} style={{background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
            <i className="ti ti-plus" />Manual Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <input type="date" value={filters.date} onChange={e=>setF('date',e.target.value)} style={{...inp,width:160}} />
        <select value={filters.departmentId} onChange={e=>setF('departmentId',e.target.value)} style={{...inp,width:180}}>
          <option value="">All Departments</option>
          {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filters.status} onChange={e=>setF('status',e.target.value)} style={{...inp,width:150}}>
          <option value="">All Statuses</option>
          {['Present','Absent','Late','Leave'].map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={()=>{setFilters({date:'',departmentId:'',status:''});setPage(1);}} style={{background:'none',border:'1px solid #2a3350',borderRadius:8,padding:'8px 12px',color:'#5c6785',cursor:'pointer',fontSize:13}}>
          Clear
        </button>
      </div>

      <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid #2a3350',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:500}}>Records</div>
          <div style={{fontSize:12,color:'#5c6785'}}>{total} total records</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:'1px solid #2a3350'}}>
              {['Date','Employee','Department','Check In','Check Out','Hours','Status'].map(h=>(
                <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,color:'#5c6785',textTransform:'uppercase',letterSpacing:.8,fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {records.map((r,i)=>(
                <tr key={r.id} style={{borderBottom:'1px solid rgba(42,51,80,.4)'}}>
                  <td style={{padding:'11px 16px',fontFamily:'Space Mono',fontSize:12,color:'#8892b0'}}>{r.date?.split('T')[0]}</td>
                  <td style={{padding:'11px 16px',fontWeight:500,fontSize:13}}>{r.employee?.name}</td>
                  <td style={{padding:'11px 16px',color:'#8892b0',fontSize:13}}>{r.employee?.department?.name}</td>
                  <td style={{padding:'11px 16px',fontFamily:'Space Mono',fontSize:12}}>{r.checkIn?new Date(r.checkIn).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
                  <td style={{padding:'11px 16px',fontFamily:'Space Mono',fontSize:12}}>{r.checkOut?new Date(r.checkOut).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
                  <td style={{padding:'11px 16px',fontFamily:'Space Mono',fontSize:12,color:'#8892b0'}}>{r.hours||'—'}</td>
                  <td style={{padding:'11px 16px'}}>{chip(r.status)}</td>
                </tr>
              ))}
              {!records.length && <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#5c6785',fontSize:13}}>No records found</td></tr>}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{padding:'12px 20px',borderTop:'1px solid #2a3350',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <div style={{fontSize:12,color:'#5c6785'}}>Page {page} of {Math.max(1,Math.ceil(total/50))}</div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{background:'none',border:'1px solid #2a3350',borderRadius:6,padding:'5px 10px',color:page===1?'#3a4468':'#8892b0',cursor:page===1?'default':'pointer',fontSize:12}}>Prev</button>
            <button onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/50)} style={{background:'none',border:'1px solid #2a3350',borderRadius:6,padding:'5px 10px',color:page>=Math.ceil(total/50)?'#3a4468':'#8892b0',cursor:'pointer',fontSize:12}}>Next</button>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={e=>{if(e.target===e.currentTarget)setModal(false);}}>
          <div style={{background:'#161b27',border:'1px solid #3a4468',borderRadius:16,width:480,maxWidth:'90vw'}}>
            <div style={{padding:'18px 24px',borderBottom:'1px solid #2a3350',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:600,fontSize:16}}>Manual Attendance Entry</div>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'1px solid #2a3350',borderRadius:6,padding:'5px 8px',color:'#8892b0',cursor:'pointer'}}><i className="ti ti-x" /></button>
            </div>
            <div style={{padding:24}}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:11,color:'#8892b0',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Employee</label>
                <select value={manualForm.employeeId} onChange={e=>setManualForm({...manualForm,employeeId:e.target.value})} style={{...inp,width:'100%'}}>
                  <option value="">Select employee...</option>
                  {employees.map(e=><option key={e.id} value={e.id}>{e.name} ({e.department?.name})</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div>
                  <label style={{display:'block',fontSize:11,color:'#8892b0',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Date</label>
                  <input type="date" value={manualForm.date} onChange={e=>setManualForm({...manualForm,date:e.target.value})} style={{...inp,width:'100%'}} />
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:'#8892b0',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Status</label>
                  <select value={manualForm.status} onChange={e=>setManualForm({...manualForm,status:e.target.value})} style={{...inp,width:'100%'}}>
                    {['Present','Late','Absent','Leave'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div>
                  <label style={{display:'block',fontSize:11,color:'#8892b0',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Check In</label>
                  <input type="time" value={manualForm.checkIn} onChange={e=>setManualForm({...manualForm,checkIn:e.target.value})} style={{...inp,width:'100%'}} />
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:'#8892b0',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Check Out</label>
                  <input type="time" value={manualForm.checkOut} onChange={e=>setManualForm({...manualForm,checkOut:e.target.value})} style={{...inp,width:'100%'}} />
                </div>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:'#8892b0',marginBottom:5,textTransform:'uppercase',letterSpacing:.5}}>Notes</label>
                <input value={manualForm.notes} onChange={e=>setManualForm({...manualForm,notes:e.target.value})} placeholder="Optional..." style={{...inp,width:'100%'}} />
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1px solid #2a3350',display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'1px solid #2a3350',borderRadius:8,padding:'8px 16px',color:'#8892b0',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={submitManual} style={{background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontSize:13,fontWeight:500,cursor:'pointer'}}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

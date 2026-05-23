import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const inp = {width:'100%',background:'#1e2538',border:'1px solid #2a3350',borderRadius:8,padding:'9px 12px',color:'#e8eaf6',fontSize:13,fontFamily:'DM Sans',outline:'none'};
const lbl = {display:'block',fontSize:11,color:'#8892b0',marginBottom:5,textTransform:'uppercase',letterSpacing:.5};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | {employee}
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
    api.get('/company').then(r => setDepartments(r.data.data.departments || [])).catch(()=>{});
  }, []);

  const load = (q='') => {
    api.get(`/employees${q?`?search=${q}`:''}`).then(r => setEmployees(r.data.data)).catch(()=>{});
  };

  useEffect(() => { const t = setTimeout(()=>load(search),300); return ()=>clearTimeout(t); }, [search]);

  const openAdd = () => { setForm({name:'',email:'',phone:'',role:'',departmentId:'',fingerprintId:'',status:'Active'}); setModal('add'); };
  const openEdit = (emp) => { setForm({...emp,departmentId:emp.departmentId}); setModal(emp); };

  const save = async () => {
    setLoading(true);
    try {
      if (modal==='add') await api.post('/employees', form);
      else await api.put(`/employees/${modal.id}`, form);
      toast.success(modal==='add'?'Employee registered':'Employee updated');
      setModal(null); load(search);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const deactivate = async (id, name) => {
    if (!confirm(`Deactivate ${name}?`)) return;
    await api.delete(`/employees/${id}`);
    toast.success('Employee deactivated');
    load(search);
  };

  const chip = (s) => <span style={{background:s==='Active'?'rgba(46,204,138,.12)':'rgba(247,85,79,.12)',color:s==='Active'?'#2ecc8a':'#f7554f',padding:'3px 10px',borderRadius:20,fontSize:11.5,fontWeight:500}}>{s}</span>;

  return (
    <div>
      <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><h1 style={{fontSize:20,fontWeight:600}}>Employees</h1><p style={{color:'#8892b0',fontSize:13,marginTop:2}}>Manage registered employees</p></div>
        <button onClick={openAdd} style={{background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans',display:'flex',alignItems:'center',gap:6}}>
          <i className="ti ti-plus" />Register Employee
        </button>
      </div>

      <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid #2a3350',display:'flex',gap:12,alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#1e2538',border:'1px solid #2a3350',borderRadius:8,padding:'7px 12px',flex:1,maxWidth:280}}>
            <i className="ti ti-search" style={{color:'#5c6785',fontSize:15}} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees..." style={{background:'none',border:'none',outline:'none',color:'#e8eaf6',fontSize:13,fontFamily:'DM Sans',width:'100%'}} />
          </div>
          <div style={{fontSize:12,color:'#5c6785'}}>{employees.length} employees</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:'1px solid #2a3350'}}>
              {['ID','Name','Department','Role','Email','Phone','Status','Actions'].map(h=>(
                <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,color:'#5c6785',textTransform:'uppercase',letterSpacing:.8,fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {employees.map((e,i)=>(
                <tr key={e.id} style={{borderBottom:'1px solid rgba(42,51,80,.5)',cursor:'pointer'}} onClick={()=>openEdit(e)}>
                  <td style={{padding:'12px 16px',fontFamily:'Space Mono',fontSize:11,color:'#5c6785'}}>{e.employeeCode}</td>
                  <td style={{padding:'12px 16px',fontWeight:500}}>{e.name}</td>
                  <td style={{padding:'12px 16px',color:'#8892b0'}}>{e.department?.name}</td>
                  <td style={{padding:'12px 16px',color:'#8892b0',fontSize:13}}>{e.role}</td>
                  <td style={{padding:'12px 16px',color:'#5c6785',fontSize:12}}>{e.email}</td>
                  <td style={{padding:'12px 16px',fontFamily:'Space Mono',fontSize:11}}>{e.phone||'—'}</td>
                  <td style={{padding:'12px 16px'}}>{chip(e.status)}</td>
                  <td style={{padding:'12px 16px'}} onClick={ev=>ev.stopPropagation()}>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>openEdit(e)} style={{background:'none',border:'1px solid #2a3350',borderRadius:6,padding:'5px 8px',color:'#8892b0',cursor:'pointer'}}>
                        <i className="ti ti-edit" style={{fontSize:13}} />
                      </button>
                      <button onClick={()=>deactivate(e.id,e.name)} style={{background:'rgba(247,85,79,.1)',border:'1px solid rgba(247,85,79,.2)',borderRadius:6,padding:'5px 8px',color:'#f7554f',cursor:'pointer'}}>
                        <i className="ti ti-user-off" style={{fontSize:13}} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!employees.length && <tr><td colSpan={8} style={{padding:32,textAlign:'center',color:'#5c6785',fontSize:13}}>No employees found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{background:'#161b27',border:'1px solid #3a4468',borderRadius:16,width:520,maxWidth:'90vw',maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'18px 24px',borderBottom:'1px solid #2a3350',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:600,fontSize:16}}>{modal==='add'?'Register Employee':'Edit Employee'}</div>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'1px solid #2a3350',borderRadius:6,padding:'5px 8px',color:'#8892b0',cursor:'pointer'}}><i className="ti ti-x" /></button>
            </div>
            <div style={{padding:24,overflowY:'auto',flex:1}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                {[['Full Name','name','text'],['Role','role','text']].map(([l,k,t])=>(
                  <div key={k}><label style={lbl}>{l}</label><input style={inp} type={t} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} /></div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} /></div>
                <div><label style={lbl}>Phone</label><input style={inp} value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div>
                  <label style={lbl}>Department</label>
                  <select style={inp} value={form.departmentId||''} onChange={e=>setForm({...form,departmentId:e.target.value})}>
                    <option value="">Select...</option>
                    {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select style={inp} value={form.status||'Active'} onChange={e=>setForm({...form,status:e.target.value})}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
              </div>
              <div><label style={lbl}>Fingerprint ID</label><input style={inp} value={form.fingerprintId||''} onChange={e=>setForm({...form,fingerprintId:e.target.value})} placeholder="e.g. FP001" /></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1px solid #2a3350',display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'1px solid #2a3350',borderRadius:8,padding:'8px 16px',color:'#8892b0',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={save} disabled={loading} style={{background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans'}}>
                {loading?'Saving...':modal==='add'?'Register':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ companyName:'', adminName:'', email:'', password:'', workStartTime:'09:00', workEndTime:'18:00' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const s = { input:{width:'100%',background:'#1e2538',border:'1px solid #2a3350',borderRadius:8,padding:'10px 12px',color:'#e8eaf6',fontSize:14,fontFamily:'DM Sans',outline:'none'}, label:{display:'block',fontSize:12,color:'#8892b0',marginBottom:6,textTransform:'uppercase',letterSpacing:.5} };

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await register(form); navigate('/'); }
    catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const f = (k) => (e) => setForm({...form,[k]:e.target.value});

  return (
    <div style={{minHeight:'100vh',background:'#0f1117',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:480}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#4f8ef7,#7c6ff7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 16px'}}>📊</div>
          <h1 style={{fontSize:24,fontWeight:600}}>Set up your company</h1>
          <p style={{color:'#8892b0',fontSize:14,marginTop:4}}>Create your AttendPro account</p>
        </div>
        <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:16,padding:32}}>
          <form onSubmit={submit}>
            {[['Company Name','companyName','text'],['Admin Name','adminName','text'],['Email','email','email'],['Password','password','password']].map(([label,key,type])=>(
              <div key={key} style={{marginBottom:16}}>
                <label style={s.label}>{label}</label>
                <input style={s.input} type={type} value={form[key]} onChange={f(key)} required />
              </div>
            ))}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
              <div><label style={s.label}>Work Start</label><input style={s.input} type="time" value={form.workStartTime} onChange={f('workStartTime')} /></div>
              <div><label style={s.label}>Work End</label><input style={s.input} type="time" value={form.workEndTime} onChange={f('workEndTime')} /></div>
            </div>
            <button type="submit" disabled={loading} style={{width:'100%',background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:11,fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans'}}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'#5c6785'}}>
            Already have an account? <Link to="/login" style={{color:'#4f8ef7',textDecoration:'none'}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

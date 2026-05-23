import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: 'admin@techcorp.com', password: 'admin123' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const s = { input: { width:'100%',background:'#1e2538',border:'1px solid #2a3350',borderRadius:8,padding:'10px 12px',color:'#e8eaf6',fontSize:14,fontFamily:'DM Sans',outline:'none' } };

  return (
    <div style={{minHeight:'100vh',background:'#0f1117',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#4f8ef7,#7c6ff7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 16px'}}>📊</div>
          <h1 style={{fontSize:24,fontWeight:600}}>Welcome back</h1>
          <p style={{color:'#8892b0',fontSize:14,marginTop:4}}>Sign in to AttendPro</p>
        </div>
        <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:16,padding:32}}>
          <form onSubmit={submit}>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:12,color:'#8892b0',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Email</label>
              <input style={s.input} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
            </div>
            <div style={{marginBottom:24}}>
              <label style={{display:'block',fontSize:12,color:'#8892b0',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Password</label>
              <input style={s.input} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
            </div>
            <button type="submit" disabled={loading} style={{width:'100%',background:'#4f8ef7',color:'#fff',border:'none',borderRadius:8,padding:'11px',fontSize:14,fontWeight:500,cursor:loading?'not-allowed':'pointer',opacity:loading?.7:1,fontFamily:'DM Sans'}}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'#5c6785'}}>
            No account? <Link to="/register" style={{color:'#4f8ef7',textDecoration:'none'}}>Create one</Link>
          </p>
          <div style={{marginTop:16,padding:12,background:'#1e2538',borderRadius:8,fontSize:12,color:'#5c6785',textAlign:'center'}}>
            Demo: admin@techcorp.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}

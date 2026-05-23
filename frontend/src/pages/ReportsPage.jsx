import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import api from '../utils/api';
Chart.register(...registerables);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ReportsPage() {
  const [tab, setTab] = useState('monthly');
  const [month, setMonth] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() + 1 });
  const [data, setData] = useState(null);
  const [heatEmp, setHeatEmp] = useState('all');
  const [employees, setEmployees] = useState([]);
  const barRef = useRef(); pieRef = useRef();
  var pieRef = useRef();
  let barChart, pieChart;

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data.data));
  }, []);

  useEffect(() => {
    api.get(`/reports/monthly?year=${month.y}&month=${month.m}`).then(r => setData(r.data.data)).catch(() => {});
  }, [month]);

  useEffect(() => {
    if (!data) return;
    const days = [];
    const daysInMonth = new Date(month.y, month.m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(month.y, month.m - 1, d);
      if (dt.getDay() === 0 || dt.getDay() === 6) continue;
      const ds = `${month.y}-${String(month.m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const count = data.records.filter(r => r.date?.startsWith(ds) && r.status !== 'Absent').length;
      days.push({ d, count });
    }
    if (barRef.current) {
      if (barChart) barChart.destroy();
      barChart = new Chart(barRef.current, {
        type: 'bar',
        data: { labels: days.map(x=>x.d), datasets:[{ label:'Present', data: days.map(x=>x.count), backgroundColor:'rgba(79,142,247,.7)', borderRadius:4 }] },
        options: { responsive:true, plugins:{legend:{labels:{color:'#8892b0',font:{size:11}}}}, scales:{x:{ticks:{color:'#5c6785'},grid:{display:false}},y:{ticks:{color:'#5c6785'},grid:{color:'#1e2538'},beginAtZero:true}} }
      });
    }
    if (pieRef.current) {
      if (pieChart) pieChart.destroy();
      pieChart = new Chart(pieRef.current, {
        type: 'pie',
        data: { labels:['Present','Late','Absent','Leave'], datasets:[{data:[data.totals.present,data.totals.late,data.totals.absent,data.totals.leave],backgroundColor:['#2ecc8a','#f7b731','#f7554f','#7c6ff7'],borderWidth:0}] },
        options: { responsive:true, plugins:{legend:{position:'bottom',labels:{color:'#8892b0',font:{size:11},padding:12}}} }
      });
    }
    return () => { barChart?.destroy(); pieChart?.destroy(); };
  }, [data]);

  const changeMonth = (d) => {
    setMonth(prev => {
      let m = prev.m + d, y = prev.y;
      if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
      return { y, m };
    });
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ['Employee','Department','Present','Late','Absent','Leave','Total Hours','Rate%'];
    const rows = data.summary.map(s => [s.employee.name, s.employee.department?.name, s.present, s.late, s.absent, s.leave, s.totalHours, s.rate]);
    const csv = [headers,...rows].map(r=>r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `report-${month.y}-${month.m}.csv`;
    a.click();
  };

  const MonthNav = () => (
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
      <button onClick={()=>changeMonth(-1)} style={{background:'none',border:'1px solid #2a3350',borderRadius:8,padding:'7px 12px',color:'#8892b0',cursor:'pointer'}}><i className="ti ti-chevron-left" /></button>
      <div style={{fontSize:16,fontWeight:600,flex:1,textAlign:'center'}}>{MONTHS[month.m-1]} {month.y}</div>
      <button onClick={()=>changeMonth(1)} style={{background:'none',border:'1px solid #2a3350',borderRadius:8,padding:'7px 12px',color:'#8892b0',cursor:'pointer'}}><i className="ti ti-chevron-right" /></button>
      <button onClick={exportCSV} style={{background:'none',border:'1px solid #3a4468',borderRadius:8,padding:'7px 14px',color:'#8892b0',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',gap:6,marginLeft:'auto'}}>
        <i className="ti ti-file-text" />Export CSV
      </button>
    </div>
  );

  // Heatmap
  const HeatmapView = () => {
    const daysInMonth = new Date(month.y, month.m, 0).getDate();
    const firstDow = new Date(month.y, month.m - 1, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(month.y, month.m - 1, d);
      const dow = dt.getDay();
      const ds = `${month.y}-${String(month.m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (dow === 0 || dow === 6) {
        cells.push(<div key={d} style={{aspectRatio:'1',borderRadius:4,background:'rgba(255,255,255,.03)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#3a4468'}}>{d}</div>);
        continue;
      }
      let recs = data?.records.filter(r => r.date?.startsWith(ds)) || [];
      if (heatEmp !== 'all') recs = recs.filter(r => r.employeeId === heatEmp);
      let cls, bg, col;
      if (heatEmp === 'all') {
        const total = employees.length || 1;
        const pct = recs.filter(r=>r.status!=='Absent').length / total;
        bg = pct > .9 ? 'rgba(46,204,138,.3)' : pct > .7 ? 'rgba(247,183,49,.25)' : pct > 0 ? 'rgba(247,85,79,.2)' : 'rgba(247,85,79,.12)';
        col = pct > .9 ? '#2ecc8a' : pct > .7 ? '#f7b731' : '#f7554f';
      } else {
        const r = recs[0];
        const cfg = {Present:['rgba(46,204,138,.25)','#2ecc8a'],Late:['rgba(247,183,49,.2)','#f7b731'],Absent:['rgba(247,85,79,.15)','#f7554f'],Leave:['rgba(124,111,247,.2)','#7c6ff7']};
        [bg,col] = r ? (cfg[r.status]||['rgba(42,51,80,.3)','#5c6785']) : ['rgba(247,85,79,.1)','#f7554f'];
      }
      cells.push(<div key={d} title={ds} style={{aspectRatio:'1',borderRadius:4,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:col,cursor:'pointer',fontFamily:'Space Mono'}}>{d}</div>);
    }
    return (
      <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:20}}>
        <MonthNav />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:500,color:'#8892b0'}}>Employee Heatmap</div>
          <select value={heatEmp} onChange={e=>setHeatEmp(e.target.value)} style={{background:'#1e2538',border:'1px solid #2a3350',borderRadius:8,padding:'6px 10px',color:'#e8eaf6',fontSize:12,fontFamily:'DM Sans',outline:'none'}}>
            <option value="all">All Employees</option>
            {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} style={{textAlign:'center',fontSize:10,color:'#5c6785',padding:'3px 0',fontFamily:'Space Mono'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>{cells}</div>
        <div style={{display:'flex',gap:16,marginTop:14,flexWrap:'wrap'}}>
          {[['Present','rgba(46,204,138,.25)'],['Late','rgba(247,183,49,.2)'],['Absent','rgba(247,85,79,.15)'],['Leave','rgba(124,111,247,.2)']].map(([l,bg])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#8892b0'}}>
              <div style={{width:12,height:12,borderRadius:3,background:bg}} />{l}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Leaderboard
  const LeaderboardView = () => {
    const sorted = [...(data?.summary||[])].sort((a,b)=>b.rate-a.rate).slice(0,10);
    return (
      <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:20}}>
        <MonthNav />
        <div style={{fontSize:13,fontWeight:500,color:'#8892b0',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
          <i className="ti ti-trophy" style={{color:'#4f8ef7'}} />Top Attendance — {MONTHS[month.m-1]} {month.y}
        </div>
        {sorted.map((s,i)=>(
          <div key={s.employee.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:i<sorted.length-1?'1px solid rgba(42,51,80,.5)':'none'}}>
            <div style={{fontSize:11,fontFamily:'Space Mono',color:'#5c6785',width:20,textAlign:'right'}}>{i+1}</div>
            <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#4f8ef7,#7c6ff7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,flexShrink:0}}>
              {s.employee.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>{s.employee.name}</div>
              <div style={{fontSize:11,color:'#5c6785'}}>{s.employee.department?.name}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'Space Mono',fontSize:14,fontWeight:600,color:s.rate>90?'#2ecc8a':s.rate>75?'#4f8ef7':'#f7b731'}}>{s.rate}%</div>
              <div style={{fontSize:11,color:'#5c6785'}}>{s.present+s.late} days</div>
            </div>
            <div style={{fontSize:20}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':''}</div>
          </div>
        ))}
      </div>
    );
  };

  const tabs = ['monthly','heatmap','leaderboard'];
  const tabLabels = ['Monthly Overview','Heatmap','Leaderboard'];

  return (
    <div>
      <div style={{marginBottom:20}}><h1 style={{fontSize:20,fontWeight:600}}>Reports & Analytics</h1><p style={{color:'#8892b0',fontSize:13,marginTop:2}}>Monthly reports and trends</p></div>

      <div style={{display:'flex',gap:4,background:'#1e2538',borderRadius:10,padding:4,marginBottom:20,width:'fit-content'}}>
        {tabs.map((t,i)=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:'7px 18px',borderRadius:7,cursor:'pointer',fontSize:13,fontFamily:'DM Sans',border:'none',background:tab===t?'#161b27':'transparent',color:tab===t?'#e8eaf6':'#8892b0',fontWeight:tab===t?500:400,transition:'all .15s'}}>
            {tabLabels[i]}
          </button>
        ))}
      </div>

      {tab==='monthly' && data && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
            {[['Working Days',new Set(data.records.map(r=>r.date?.split('T')[0])).size,'#4f8ef7'],['Present',data.totals.present,'#2ecc8a'],['Late',data.totals.late,'#f7b731'],['Absent',data.totals.absent,'#f7554f']].map(([l,v,c])=>(
              <div key={l} style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:18}}>
                <div style={{fontSize:11,color:'#5c6785',textTransform:'uppercase',letterSpacing:.8,marginBottom:6}}>{l}</div>
                <div style={{fontSize:26,fontWeight:600,fontFamily:'Space Mono',color:c}}>{v}</div>
              </div>
            ))}
          </div>
          <MonthNav />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
            <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:500,color:'#8892b0',marginBottom:16}}>Daily Presence Count</div>
              <canvas ref={barRef} height={200} />
            </div>
            <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:500,color:'#8892b0',marginBottom:16}}>Status Breakdown</div>
              <canvas ref={pieRef} height={200} />
            </div>
          </div>
          <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #2a3350',fontWeight:500}}>Employee Summary</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:'1px solid #2a3350'}}>
                  {['Employee','Dept.','Present','Late','Absent','Leave','Hours','Rate'].map(h=>(
                    <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,color:'#5c6785',textTransform:'uppercase',letterSpacing:.8,fontWeight:500}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[...data.summary].sort((a,b)=>b.rate-a.rate).map((s,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid rgba(42,51,80,.4)'}}>
                      <td style={{padding:'11px 16px',fontWeight:500,fontSize:13}}>{s.employee.name}</td>
                      <td style={{padding:'11px 16px',color:'#8892b0',fontSize:13}}>{s.employee.department?.name}</td>
                      <td style={{padding:'11px 16px',color:'#2ecc8a',fontFamily:'Space Mono',fontSize:12}}>{s.present}</td>
                      <td style={{padding:'11px 16px',color:'#f7b731',fontFamily:'Space Mono',fontSize:12}}>{s.late}</td>
                      <td style={{padding:'11px 16px',color:'#f7554f',fontFamily:'Space Mono',fontSize:12}}>{s.absent}</td>
                      <td style={{padding:'11px 16px',color:'#7c6ff7',fontFamily:'Space Mono',fontSize:12}}>{s.leave}</td>
                      <td style={{padding:'11px 16px',fontFamily:'Space Mono',fontSize:12,color:'#8892b0'}}>{s.totalHours}h</td>
                      <td style={{padding:'11px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,background:'#252d3f',borderRadius:4,height:5,overflow:'hidden',minWidth:60}}>
                            <div style={{width:`${s.rate}%`,height:'100%',background:s.rate>90?'#2ecc8a':s.rate>70?'#4f8ef7':'#f7b731',borderRadius:4}} />
                          </div>
                          <span style={{fontFamily:'Space Mono',fontSize:11,minWidth:36}}>{s.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab==='heatmap' && <HeatmapView />}
      {tab==='leaderboard' && <LeaderboardView />}
    </div>
  );
}

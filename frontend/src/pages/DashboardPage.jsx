import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import api from '../utils/api';
Chart.register(...registerables);

const StatCard = ({label,value,color,icon,sub}) => (
  <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:20}}>
    <div style={{fontSize:11,color:'#5c6785',textTransform:'uppercase',letterSpacing:.8,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
      <i className={`ti ti-${icon}`} style={{color}} />{label}
    </div>
    <div style={{fontSize:26,fontWeight:600,fontFamily:'Space Mono',color}}>{value}</div>
    <div style={{fontSize:11,color:'#5c6785',marginTop:4}}>{sub}</div>
  </div>
);

export default function DashboardPage() {
  const [summary, setSummary] = useState({ total:0, present:0, late:0, absent:0, records:[] });
  const [weekly, setWeekly] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const weeklyRef = useRef(); donutRef = useRef();
  let weeklyChart, donutChart;
  var donutRef = useRef();

  useEffect(() => {
    Promise.all([
      api.get('/attendance/today-summary'),
      api.get('/reports/weekly'),
      api.get('/reports/department'),
    ]).then(([s, w, d]) => {
      setSummary(s.data.data);
      setWeekly(w.data.data);
      setDeptData(d.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!weekly.length) return;
    if (weeklyRef.current) {
      if (weeklyChart) weeklyChart.destroy();
      weeklyChart = new Chart(weeklyRef.current, {
        type: 'line',
        data: { labels: weekly.map(w=>w.day), datasets: [
          { label:'Present', data: weekly.map(w=>w.present), borderColor:'#4f8ef7', backgroundColor:'rgba(79,142,247,.1)', tension:.4, fill:true, pointRadius:4 },
          { label:'Absent', data: weekly.map(w=>w.absent), borderColor:'#f7554f', backgroundColor:'rgba(247,85,79,.08)', tension:.4, fill:true, pointRadius:4 },
        ]},
        options: { responsive:true, plugins:{legend:{labels:{color:'#8892b0',font:{size:11}}}}, scales:{x:{ticks:{color:'#5c6785'},grid:{color:'#1e2538'}},y:{ticks:{color:'#5c6785'},grid:{color:'#1e2538'},beginAtZero:true}} }
      });
    }
    return () => weeklyChart?.destroy();
  }, [weekly]);

  useEffect(() => {
    if (!summary.total) return;
    if (donutRef.current) {
      if (donutChart) donutChart.destroy();
      donutChart = new Chart(donutRef.current, {
        type: 'doughnut',
        data: { labels:['Present','Late','Absent'], datasets:[{data:[summary.present,summary.late,summary.absent],backgroundColor:['#2ecc8a','#f7b731','#f7554f'],borderWidth:0}] },
        options: { responsive:true, cutout:'68%', plugins:{legend:{position:'bottom',labels:{color:'#8892b0',font:{size:11},padding:12}}} }
      });
    }
    return () => donutChart?.destroy();
  }, [summary]);

  const rate = summary.total ? Math.round((summary.present + summary.late) / summary.total * 100) : 0;

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:20,fontWeight:600}}>Dashboard</h1>
        <p style={{color:'#8892b0',fontSize:13,marginTop:2}}>Overview of today's attendance</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        <StatCard label="Total Staff" value={summary.total} color="#4f8ef7" icon="users" sub="Active employees" />
        <StatCard label="Present Today" value={summary.present} color="#2ecc8a" icon="check" sub={`${rate}% attendance rate`} />
        <StatCard label="Late Arrivals" value={summary.late} color="#f7b731" icon="clock" sub="After work start time" />
        <StatCard label="Absent" value={summary.absent} color="#f7554f" icon="x" sub="No check-in yet" />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:500,color:'#8892b0',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <i className="ti ti-chart-line" style={{color:'#4f8ef7'}} />Weekly Attendance Trend
          </div>
          <canvas ref={weeklyRef} height={180} />
        </div>
        <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:500,color:'#8892b0',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <i className="ti ti-chart-donut" style={{color:'#4f8ef7'}} />Today's Summary
          </div>
          <canvas ref={donutRef} height={180} />
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #2a3350',fontSize:14,fontWeight:500}}>Recent Check-ins</div>
          <div style={{padding:'0 16px'}}>
            {summary.records.slice(0,6).map((r,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:i<5?'1px solid rgba(42,51,80,.5)':'none'}}>
                <div style={{width:8,height:8,borderRadius:'50%',flexShrink:0,background:r.status==='Absent'?'#f7554f':'#2ecc8a'}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{r.employee?.name}</div>
                  <div style={{fontSize:11,color:'#5c6785'}}>{r.employee?.department?.name}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,fontFamily:'Space Mono',color:'#8892b0'}}>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '--:--'}</div>
                  <div style={{fontSize:11,color:'#5c6785'}}>{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'#161b27',border:'1px solid #2a3350',borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:500,color:'#8892b0',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <i className="ti ti-users" style={{color:'#4f8ef7'}} />Dept. Attendance Rate
          </div>
          {deptData.map((d,i)=>{
            const colors=['#4f8ef7','#2ecc8a','#f7b731','#7c6ff7','#f7554f','#4fc3f7'];
            return (
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span>{d.department}</span><span style={{color:'#8892b0'}}>{d.present}/{d.total} ({d.rate}%)</span>
                </div>
                <div style={{background:'#252d3f',borderRadius:4,height:6,overflow:'hidden'}}>
                  <div style={{width:`${d.rate}%`,height:'100%',background:colors[i%colors.length],borderRadius:4,transition:'width .6s ease'}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

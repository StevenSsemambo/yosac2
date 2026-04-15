import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db, getSaccoStats, formatUGX, programLabel, programColor } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Download, FileText, Users, PiggyBank, CreditCard, CheckCircle, AlertTriangle, Building2, Shield } from 'lucide-react';

export default function Reports() {
  const { activeSacco } = useApp();
  const [stats, setStats]         = useState(null);
  const [members, setMembers]     = useState([]);
  const [savingsData, setSavingsData] = useState([]);
  const [loanData, setLoanData]   = useState([]);
  const [compliance, setCompliance] = useState(null);

  useEffect(() => { if (activeSacco) load(); }, [activeSacco]);

  async function load() {
    const s = await getSaccoStats(activeSacco.id);
    setStats(s);

    const m = await db.members.where({ saccoId: activeSacco.id }).toArray();
    setMembers(m);

    // Monthly savings chart - last 6 months
    const allSavings = await db.savings.where({ saccoId: activeSacco.id }).toArray();
    const monthly = {};
    allSavings.forEach(s => {
      const mo = s.date?.slice(0, 7) || 'unknown';
      monthly[mo] = (monthly[mo] || 0) + (s.amount > 0 ? s.amount : 0);
    });
    const sorted = Object.entries(monthly).sort().slice(-6).map(([mo, amt]) => ({
      month: mo.slice(5) + '/' + mo.slice(2,4),
      savings: amt,
    }));
    setSavingsData(sorted);

    // Loan status breakdown
    const loans = await db.loans.where({ saccoId: activeSacco.id }).toArray();
    const lStatus = {};
    loans.forEach(l => { lStatus[l.status] = (lStatus[l.status]||0) + 1; });
    setLoanData(Object.entries(lStatus).map(([name, value]) => ({ name, value })));

    // Compliance
    const score = computeCompliance(activeSacco, s, m, loans);
    setCompliance(score);
  }

  function computeCompliance(sacco, s, m, loans) {
    let score = 100;
    const checks = [];
    const active = m.filter(x => x.status === 'active');

    if (active.length >= 5) checks.push({ label: 'Minimum members met', pass: true });
    else { score -= 20; checks.push({ label: `Need ${5-active.length} more active members`, pass: false }); }

    if (s.totalSavings > 0) checks.push({ label: 'Savings recorded', pass: true });
    else { score -= 15; checks.push({ label: 'No savings on record', pass: false }); }

    const overdue = loans.filter(l => l.status === 'overdue');
    if (overdue.length === 0) checks.push({ label: 'No overdue loans', pass: true });
    else { score -= overdue.length * 10; checks.push({ label: `${overdue.length} overdue loan(s)`, pass: false }); }

    if (sacco.program === 'pdm') {
      const over1M = loans.filter(l => l.amount > 1000000);
      if (over1M.length === 0) checks.push({ label: 'PDM loan cap (1M) respected', pass: true });
      else { score -= 15; checks.push({ label: `${over1M.length} loan(s) exceed PDM cap`, pass: false }); }
    }

    if (s.available >= 0) checks.push({ label: 'Fund pool healthy', pass: true });
    else { score -= 25; checks.push({ label: 'Over-lent: liabilities exceed pool', pass: false }); }

    return { score: Math.max(0, score), checks };
  }

  const COLORS = ['#2563EB','#16A34A','#F59E0B','#DC2626','#7C3AED'];

  if (!activeSacco) return <div style={{ padding:'80px 20px', textAlign:'center', color:'#9CA3AF' }}>Select a SACCO first</div>;

  const scoreColor = compliance?.score >= 80 ? '#16A34A' : compliance?.score >= 60 ? '#F59E0B' : '#DC2626';
  const scoreLabel = compliance?.score >= 80 ? 'Good Standing' : compliance?.score >= 60 ? 'Needs Attention' : 'At Risk';

  return (
    <div style={{ paddingBottom:'80px' }} className="page-enter">

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #78350F 0%, #D97706 100%)', padding:'52px 20px 20px', color:'white' }}>
        <div style={{ fontSize:'11px', opacity:0.65, fontWeight:'600', letterSpacing:'0.06em' }}>REPORTS & ANALYTICS</div>
        <h1 style={{ fontSize:'22px', fontWeight:'800', margin:'4px 0 0' }}>{activeSacco.name}</h1>
        <div style={{ fontSize:'12px', opacity:0.75, marginTop:'2px' }}>{programLabel(activeSacco.program)} · {activeSacco.district}</div>
      </div>

      <div style={{ padding:'16px 20px' }}>

        {/* Stat grid */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
            {[
              { label:'Total Pool',  value: formatUGX(stats.totalPool),    color:'#1D4ED8', Icon: Building2 },
              { label:'Available',   value: formatUGX(Math.max(0,stats.available)), color:'#16A34A', Icon: CheckCircle },
              { label:'Lent Out',    value: formatUGX(stats.totalLent),    color:'#F59E0B', Icon: CreditCard },
              { label:'Members',     value: stats.members,                 color:'#7C3AED', Icon: Users },
            ].map(({ label, value, color, Icon: Ic }) => (
              <div key={label} style={{ background:'white', borderRadius:'16px', border:'1px solid #E2E8F0', padding:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'600', marginBottom:'4px' }}>{label}</div>
                    <div style={{ fontSize:'17px', fontWeight:'800', color:'#111827' }}>{value}</div>
                  </div>
                  <div style={{ background:color+'15', borderRadius:'10px', padding:'8px' }}><Ic size={16} color={color} /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compliance Card */}
        {compliance && (
          <div style={{ background:'white', borderRadius:'16px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Shield size={18} color={scoreColor} />
                <span style={{ fontSize:'15px', fontWeight:'800', color:'#111827' }}>Compliance Score</span>
              </div>
              <span style={{ fontSize:'12px', fontWeight:'700', color:scoreColor, background:scoreColor+'18', padding:'3px 10px', borderRadius:'20px' }}>{scoreLabel}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
              <div style={{ flex:1, height:'10px', background:'#E2E8F0', borderRadius:'5px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${compliance.score}%`, background:scoreColor, borderRadius:'5px', transition:'width 0.6s ease' }} />
              </div>
              <span style={{ fontSize:'24px', fontWeight:'800', color:scoreColor, minWidth:'50px' }}>{compliance.score}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {compliance.checks.map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12.5px', color: c.pass?'#374151':'#DC2626' }}>
                  {c.pass ? <CheckCircle size={14} color="#16A34A" /> : <AlertTriangle size={14} color="#DC2626" />}
                  {c.label}
                </div>
              ))}
            </div>
            {compliance.score >= 80 && (
              <div style={{ marginTop:'12px', background:'#DCFCE7', borderRadius:'10px', padding:'10px 12px', fontSize:'12.5px', color:'#16A34A', fontWeight:'600' }}>
                ✓ This SACCO is eligible for additional MSC / Emyooga funding
              </div>
            )}
          </div>
        )}

        {/* Savings chart */}
        {savingsData.length > 0 && (
          <div style={{ background:'white', borderRadius:'16px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'20px' }}>
            <div style={{ fontSize:'14px', fontWeight:'800', color:'#111827', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
              <TrendingUp size={16} color="#16A34A" /> Monthly Savings
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={savingsData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => v>=1000000?`${v/1000000}M`:v>=1000?`${v/1000}K`:v} />
                <Tooltip formatter={v => formatUGX(v)} contentStyle={{ borderRadius:'10px', border:'1px solid #E2E8F0', fontSize:'12px' }} />
                <Bar dataKey="savings" fill="#16A34A" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Loan breakdown */}
        {loanData.length > 0 && (
          <div style={{ background:'white', borderRadius:'16px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'20px' }}>
            <div style={{ fontSize:'14px', fontWeight:'800', color:'#111827', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
              <CreditCard size={16} color="#2563EB" /> Loan Status Breakdown
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              <PieChart width={120} height={120}>
                <Pie data={loanData} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={2}>
                  {loanData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
                {loanData.map((d, i) => (
                  <div key={d.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:COLORS[i%COLORS.length] }} />
                      <span style={{ fontSize:'12px', color:'#374151', textTransform:'capitalize' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#111827' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SACCO Info */}
        <div style={{ background:'white', borderRadius:'16px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'20px' }}>
          <div style={{ fontSize:'14px', fontWeight:'800', color:'#111827', marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
            <Building2 size={16} color="#7C3AED" /> SACCO Profile
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[
              { label:'Programme',     value: programLabel(activeSacco.program) },
              { label:'District',      value: activeSacco.district },
              { label:'Parish',        value: activeSacco.parish },
              { label:'Chairperson',   value: activeSacco.chairperson || 'N/A' },
              { label:'Treasurer',     value: activeSacco.treasurer || 'N/A' },
              { label:'Reg. Number',   value: activeSacco.registrationNo || 'N/A' },
              { label:'Registered On', value: activeSacco.createdAt ? new Date(activeSacco.createdAt).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric' }) : 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #F8FAFC' }}>
                <span style={{ fontSize:'12px', color:'#9CA3AF', fontWeight:'600' }}>{label}</span>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#111827' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export hint */}
        <div style={{ background:'#EFF6FF', borderRadius:'16px', padding:'14px', display:'flex', alignItems:'center', gap:'12px', border:'1px solid #BFDBFE' }}>
          <FileText size={20} color="#2563EB" style={{ flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#1D4ED8' }}>PDF Report</div>
            <div style={{ fontSize:'11.5px', color:'#3B82F6', marginTop:'2px' }}>Full report export with PDF generation coming in the next sprint</div>
          </div>
        </div>

        {/* Brand */}
        <div style={{ textAlign:'center', marginTop:'24px' }}>
          <div style={{ fontSize:'13px', fontWeight:'800', color:'#1D4ED8' }}>YoSacco</div>
          <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'2px' }}>by Steven · SayMyTech Developers · Kampala, Uganda</div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { db, getSaccoStats, formatUGX, programLabel, programColor, programBg } from '../db';
import { TrendingUp, Users, AlertTriangle, CheckCircle, ChevronRight, Plus, Bell, Wallet, CreditCard, PiggyBank, Building2 } from 'lucide-react';

export default function Dashboard() {
  const { activeSacco, setActiveSacco, saccos } = useApp();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeSacco) return;
    loadData();
  }, [activeSacco]);

  async function loadData() {
    const s = await getSaccoStats(activeSacco.id);
    setStats(s);
    const a = await db.alerts.where({ saccoId: activeSacco.id, resolved: false }).toArray();
    setAlerts(a.slice(0, 3));
    // recent savings + repayments as timeline
    const savings = await db.savings.where({ saccoId: activeSacco.id }).reverse().limit(3).toArray();
    const loans = await db.loans.where({ saccoId: activeSacco.id }).reverse().limit(2).toArray();
    setRecentTx([...savings.map(s => ({ ...s, kind: 'savings' })), ...loans.map(l => ({ ...l, kind: 'loan' }))].slice(0, 4));
  }

  if (!activeSacco) return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <Building2 size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: '#6B7280', marginBottom: '16px' }}>No SACCO selected</p>
      <button className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => navigate('/saccos')}>
        <Plus size={16} /> Create SACCO
      </button>
    </div>
  );

  const pColor = programColor(activeSacco.program);
  const pBg    = programBg(activeSacco.program);

  return (
    <div style={{ paddingBottom: '80px' }} className="page-enter">

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)`, color: 'white', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.65, letterSpacing: '0.08em', marginBottom: '4px' }}>
              YOSACCO · SAYIMYTECH DEVELOPERS
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, lineHeight: 1.2 }}>{activeSacco.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ background: pColor, color: 'white', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
                {programLabel(activeSacco.program)}
              </span>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>{activeSacco.parish}, {activeSacco.district}</span>
            </div>
          </div>
          <button onClick={() => {}} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <Bell size={18} color="white" />
            {alerts.length > 0 && <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#F59E0B', borderRadius: '50%' }} />}
          </button>
        </div>

        {/* Pool card */}
        {stats && (
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.7, letterSpacing: '0.06em', marginBottom: '4px' }}>TOTAL POOL</div>
            <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>{formatUGX(stats.totalPool)}</div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', opacity: 0.65, marginBottom: '2px' }}>Available</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#4ADE80' }}>{formatUGX(Math.max(0, stats.available))}</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: '10px', opacity: 0.65, marginBottom: '2px' }}>Lent Out</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#FCD34D' }}>{formatUGX(stats.totalLent)}</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: '10px', opacity: 0.65, marginBottom: '2px' }}>Members</div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>{stats.members}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '20px' }}>

        {/* ── Quick actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Add Member',   Icon: Users,       path: '/members',  color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Deposit',      Icon: PiggyBank,   path: '/savings',  color: '#16A34A', bg: '#F0FDF4' },
            { label: 'New Loan',     Icon: CreditCard,  path: '/loans',    color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Reports',      Icon: TrendingUp,  path: '/reports',  color: '#D97706', bg: '#FFFBEB' },
          ].map(({ label, Icon, path, color, bg }) => (
            <button key={label} onClick={() => navigate(path)} style={{
              background: bg, border: `1px solid ${color}22`, borderRadius: '14px',
              padding: '12px 4px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'transform 0.15s',
            }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
               onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
               onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
               onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Icon size={20} color={color} />
              <span style={{ fontSize: '10px', fontWeight: '700', color, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Stat grid ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Savings', value: formatUGX(stats.totalSavings), Icon: PiggyBank, color: '#16A34A' },
              { label: 'Total Shares',  value: formatUGX(stats.totalShares),  Icon: Wallet,    color: '#7C3AED' },
              { label: 'Active Loans',  value: stats.activeLoans,             Icon: CreditCard, color: '#2563EB' },
              { label: 'Repaid',        value: formatUGX(stats.totalRepaid),  Icon: CheckCircle, color: '#D97706' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="card" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>{value}</div>
                  </div>
                  <div style={{ background: color + '15', borderRadius: '10px', padding: '8px' }}>
                    <Icon size={16} color={color} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#111827', marginBottom: '10px' }}>⚠️ Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map(a => (
                <div key={a.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '3px solid #F59E0B' }}>
                  <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', color: '#374151', flex: 1 }}>{a.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Switch SACCO ── */}
        {saccos.length > 1 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#111827', marginBottom: '10px' }}>Switch SACCO</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {saccos.map(s => (
                <button key={s.id} onClick={() => setActiveSacco(s)}
                  className="card"
                  style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', border: s.id === activeSacco?.id ? `2px solid #1D4ED8` : '1px solid #E2E8F0', cursor: 'pointer', background: s.id === activeSacco?.id ? '#EFF6FF' : 'white' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: programBg(s.program), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={16} color={programColor(s.program)} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{programLabel(s.program)} · {s.parish}</div>
                  </div>
                  {s.id === activeSacco?.id && <CheckCircle size={16} color="#1D4ED8" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Compliance score ── */}
        <ComplianceWidget sacco={activeSacco} stats={stats} />

        {/* ── Brand footer ── */}
        <div style={{ textAlign: 'center', marginTop: '24px', padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#1D4ED8', letterSpacing: '-0.01em' }}>YoSacco</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>by Steven · SayMyTech Developers · Kampala, Uganda</div>
        </div>
      </div>
    </div>
  );
}

function ComplianceWidget({ sacco, stats }) {
  if (!sacco || !stats) return null;

  // Rule-based compliance score
  let score = 100;
  const issues = [];
  if (stats.members < 5) { score -= 20; issues.push('Minimum 5 members required'); }
  if (stats.totalSavings === 0) { score -= 15; issues.push('No savings recorded'); }
  if (stats.activeLoans > 0 && stats.available < 0) { score -= 25; issues.push('Over-lent: liabilities exceed pool'); }

  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#F59E0B' : '#DC2626';
  const label = score >= 80 ? 'Good Standing' : score >= 60 ? 'Needs Attention' : 'At Risk';

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: '800', color: '#111827' }}>Compliance Score</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color, background: color + '15', padding: '3px 10px', borderRadius: '20px' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ fontSize: '20px', fontWeight: '800', color, minWidth: '44px' }}>{score}</span>
      </div>
      {issues.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {issues.map(i => (
            <div key={i} style={{ fontSize: '11.5px', color: '#DC2626', display: 'flex', gap: '6px' }}>
              <span>•</span>{i}
            </div>
          ))}
        </div>
      )}
      {score >= 80 && <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#16A34A' }}>✓ Eligible for additional MSC funding</div>}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db, formatUGX } from '../db';
import Modal from '../components/Modal';
import { PiggyBank, Plus, ArrowDownLeft, ArrowUpRight, Search, TrendingUp } from 'lucide-react';

export default function Savings() {
  const { activeSacco, showToast } = useApp();
  const [savings, setSavings]   = useState([]);
  const [members, setMembers]   = useState([]);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab]           = useState('history'); // history | summary
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ memberId: '', amount: '', type: 'deposit', date: new Date().toISOString().slice(0,10), notes: '' });

  useEffect(() => { if (activeSacco) load(); }, [activeSacco]);

  async function load() {
    const [s, m] = await Promise.all([
      db.savings.where({ saccoId: activeSacco.id }).reverse().toArray(),
      db.members.where({ saccoId: activeSacco.id, status: 'active' }).toArray(),
    ]);
    setSavings(s);
    setMembers(m);
    if (m.length && !form.memberId) setForm(f => ({ ...f, memberId: String(m[0].id) }));
  }

  async function submit() {
    if (!form.memberId || !form.amount || Number(form.amount) <= 0) return showToast('Fill all required fields', 'error');
    setSaving(true);
    const amount = Number(form.amount);
    await db.savings.add({ memberId: Number(form.memberId), saccoId: activeSacco.id, amount: form.type === 'withdrawal' ? -amount : amount, type: form.type, date: form.date, notes: form.notes });
    await db.transactions.add({ saccoId: activeSacco.id, type: form.type, amount, description: `${form.type} — ${members.find(m=>m.id===Number(form.memberId))?.name}`, createdAt: new Date().toISOString() });
    showToast(`${form.type === 'deposit' ? 'Deposit' : 'Withdrawal'} recorded`);
    setShowModal(false);
    setSaving(false);
    setForm(f => ({ ...f, amount: '', notes: '' }));
    load();
  }

  // Per-member summary
  const summary = members.map(m => {
    const ms = savings.filter(s => s.memberId === m.id);
    const total = ms.reduce((a, s) => a + s.amount, 0);
    return { ...m, total, count: ms.length };
  }).sort((a, b) => b.total - a.total);

  const filtered = savings.filter(s => {
    const m = members.find(x => x.id === s.memberId);
    return !search || m?.name.toLowerCase().includes(search.toLowerCase());
  });

  const totalSavings = savings.reduce((a, s) => a + s.amount, 0);

  if (!activeSacco) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#9CA3AF' }}>Select a SACCO first</div>;

  return (
    <div style={{ paddingBottom: '80px' }} className="page-enter">

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #14532D 0%, #16A34A 100%)', padding: '52px 20px 20px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.65, fontWeight: '600', letterSpacing: '0.06em' }}>SAVINGS</div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>{formatUGX(totalSavings)}</h1>
            <div style={{ fontSize: '12px', opacity: 0.75 }}>{savings.filter(s=>s.amount>0).length} deposits · {savings.filter(s=>s.amount<0).length} withdrawals</div>
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '14px', padding: '10px 16px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
            <Plus size={16} /> Record
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#F1F5F9', margin: '16px 20px 0', borderRadius: '12px', padding: '4px' }}>
        {[['history','History'],['summary','Per Member']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '9px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', background: tab===v ? 'white' : 'transparent', color: tab===v ? '#1D4ED8' : '#6B7280', boxShadow: tab===v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {tab === 'history' && (
          <>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input className="input" placeholder="Search member…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '40px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(s => {
                const m = members.find(x => x.id === s.memberId);
                const isDeposit = s.amount >= 0;
                return (
                  <div key={s.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: isDeposit ? '#DCFCE7' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isDeposit ? <ArrowDownLeft size={18} color="#16A34A" /> : <ArrowUpRight size={18} color="#DC2626" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#111827' }}>{m?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{s.date} {s.notes && `· ${s.notes}`}</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: isDeposit ? '#16A34A' : '#DC2626' }}>
                      {isDeposit ? '+' : ''}{formatUGX(s.amount)}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <EmptyList icon={<PiggyBank size={40} />} label="No savings recorded yet" />}
            </div>
          </>
        )}

        {tab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.map((m, i) => (
              <div key={m.id} className="card" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{m.count} transactions</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: m.total >= 0 ? '#16A34A' : '#DC2626' }}>{formatUGX(m.total)}</div>
                </div>
                {/* Progress bar relative to top saver */}
                <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '2px', background: '#16A34A', width: summary[0]?.total > 0 ? `${(m.total/summary[0].total)*100}%` : '0%', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Transaction">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Type toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '12px', padding: '4px' }}>
            {[['deposit','Deposit'],['withdrawal','Withdrawal']].map(([v,l]) => (
              <button key={v} onClick={() => setForm(f=>({...f,type:v}))} style={{ flex:1, padding:'8px', border:'none', borderRadius:'9px', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', background:form.type===v?'white':'transparent', color:form.type===v?(v==='deposit'?'#16A34A':'#DC2626'):'#6B7280', boxShadow:form.type===v?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>{l}</button>
            ))}
          </div>
          <div>
            <label className="label">Member *</label>
            <select className="select" value={form.memberId} onChange={e => setForm(f=>({...f,memberId:e.target.value}))}>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (UGX) *</label>
            <input className="input" type="number" placeholder="e.g. 150000" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="e.g. Monthly savings March" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
          </div>
          <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" style={{ background: form.type==='deposit'?'#16A34A':'#DC2626' }} onClick={submit} disabled={saving}>
              {saving ? 'Saving…' : form.type === 'deposit' ? '+ Record Deposit' : '− Record Withdrawal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EmptyList({ icon, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#CBD5E1' }}>
      {icon}
      <div style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px' }}>{label}</div>
    </div>
  );
}

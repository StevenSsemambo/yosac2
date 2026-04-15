import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db, formatUGX, loanStatusColor } from '../db';
import Modal from '../components/Modal';
import { CreditCard, Plus, CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Banknote } from 'lucide-react';

const STATUS_FLOW = { pending: ['approved','rejected'], approved: ['active','rejected'], active: ['completed'], completed: [], rejected: [] };
const PROGRAM_RATES = { emyooga: 10, pdm: 6, owc: 8 };

export default function Loans() {
  const { activeSacco, showToast } = useApp();
  const [loans, setLoans]       = useState([]);
  const [members, setMembers]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [showApply, setShowApply]   = useState(false);
  const [showRepay, setShowRepay]   = useState(false);
  const [tab, setTab] = useState('active');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ memberId:'', amount:'', purpose:'', interestRate:'', dueDate:'', cropCycle:'' });
  const [repayForm, setRepayForm] = useState({ amount:'', date: new Date().toISOString().slice(0,10), notes:'' });

  useEffect(() => { if (activeSacco) load(); }, [activeSacco]);

  async function load() {
    const [l, m] = await Promise.all([
      db.loans.where({ saccoId: activeSacco.id }).reverse().toArray(),
      db.members.where({ saccoId: activeSacco.id, status: 'active' }).toArray(),
    ]);
    // Auto-flag overdue
    const now = new Date();
    for (const loan of l) {
      if (loan.status === 'active' && loan.dueDate && new Date(loan.dueDate) < now) {
        await db.loans.update(loan.id, { status: 'overdue' });
        loan.status = 'overdue';
      }
    }
    setLoans(l);
    setMembers(m);
    if (m.length && !form.memberId) {
      const rate = PROGRAM_RATES[activeSacco.program] || 10;
      setForm(f => ({ ...f, memberId: String(m[0].id), interestRate: String(rate) }));
    }
  }

  async function openLoan(loan) {
    setSelected(loan);
    const reps = await db.repayments.where({ loanId: loan.id }).toArray();
    setRepayments(reps);
  }

  async function applyLoan() {
    if (!form.memberId || !form.amount || !form.purpose || !form.dueDate) return showToast('Fill all required fields', 'error');
    setSaving(true);
    const member = members.find(m => m.id === Number(form.memberId));
    // PDM cap check
    if (activeSacco.program === 'pdm' && Number(form.amount) > 1000000) {
      showToast('PDM loans capped at UGX 1,000,000', 'error');
      setSaving(false); return;
    }
    await db.loans.add({
      memberId: Number(form.memberId), saccoId: activeSacco.id,
      amount: Number(form.amount), interestRate: Number(form.interestRate),
      purpose: form.purpose, status: 'pending',
      appliedAt: new Date().toISOString(), approvedAt: null,
      dueDate: form.dueDate, cropCycle: form.cropCycle || null,
    });
    await db.transactions.add({ saccoId: activeSacco.id, type: 'loan_applied', amount: Number(form.amount), description: `Loan application — ${member?.name}: ${form.purpose}`, createdAt: new Date().toISOString() });
    showToast('Loan application submitted');
    setShowApply(false);
    setSaving(false);
    setForm(f => ({ ...f, amount:'', purpose:'', dueDate:'', cropCycle:'' }));
    load();
  }

  async function updateStatus(loan, newStatus) {
    const updates = { status: newStatus };
    if (newStatus === 'approved' || newStatus === 'active') updates.approvedAt = new Date().toISOString();
    await db.loans.update(loan.id, updates);
    if (newStatus === 'active') {
      await db.transactions.add({ saccoId: activeSacco.id, type: 'loan_disbursed', amount: loan.amount, description: `Loan disbursed — ${members.find(m=>m.id===loan.memberId)?.name}`, createdAt: new Date().toISOString() });
    }
    showToast(`Loan marked as ${newStatus}`);
    setSelected(null);
    load();
  }

  async function recordRepayment() {
    if (!repayForm.amount || Number(repayForm.amount) <= 0) return showToast('Enter a valid amount', 'error');
    setSaving(true);
    await db.repayments.add({ loanId: selected.id, memberId: selected.memberId, saccoId: activeSacco.id, amount: Number(repayForm.amount), date: repayForm.date, notes: repayForm.notes });
    // Check if fully repaid
    const allReps = [...repayments, { amount: Number(repayForm.amount) }];
    const totalRepaid = allReps.reduce((a, r) => a + r.amount, 0);
    const totalDue = selected.amount * (1 + selected.interestRate / 100);
    if (totalRepaid >= totalDue) {
      await db.loans.update(selected.id, { status: 'completed' });
      showToast('Loan fully repaid! 🎉');
    } else {
      showToast(`Repayment recorded. ${formatUGX(totalDue - totalRepaid)} remaining`);
    }
    await db.transactions.add({ saccoId: activeSacco.id, type: 'repayment', amount: Number(repayForm.amount), description: `Repayment — ${members.find(m=>m.id===selected.memberId)?.name}`, createdAt: new Date().toISOString() });
    setSaving(false);
    setShowRepay(false);
    setRepayForm({ amount:'', date: new Date().toISOString().slice(0,10), notes:'' });
    setSelected(null);
    load();
  }

  const tabs = [
    { key: 'active',    label: 'Active',    statuses: ['active','overdue','approved'] },
    { key: 'pending',   label: 'Pending',   statuses: ['pending'] },
    { key: 'completed', label: 'Completed', statuses: ['completed','rejected'] },
  ];
  const filtered = loans.filter(l => tabs.find(t=>t.key===tab)?.statuses.includes(l.status));

  const totalLent = loans.filter(l=>['active','overdue','approved'].includes(l.status)).reduce((a,l)=>a+l.amount,0);
  const overdueCount = loans.filter(l=>l.status==='overdue').length;

  if (!activeSacco) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#9CA3AF' }}>Select a SACCO first</div>;

  return (
    <div style={{ paddingBottom: '80px' }} className="page-enter">

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)', padding: '52px 20px 20px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.65, fontWeight: '600', letterSpacing: '0.06em' }}>LOANS</div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>{formatUGX(totalLent)}</h1>
            <div style={{ fontSize: '12px', opacity: 0.75 }}>
              {loans.filter(l=>['active','overdue'].includes(l.status)).length} active
              {overdueCount > 0 && <span style={{ color: '#FCA5A5', marginLeft: '8px' }}>· {overdueCount} overdue ⚠️</span>}
            </div>
          </div>
          <button onClick={() => setShowApply(true)} style={{ background: '#F59E0B', border: 'none', borderRadius: '14px', padding: '10px 16px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
            <Plus size={16} /> Apply
          </button>
        </div>

        {/* Programme rule chip */}
        <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 12px', fontSize: '11.5px', opacity: 0.9 }}>
          {activeSacco.program === 'pdm' && '📋 PDM Rule: Max UGX 1M per household · 6% interest · No commissions'}
          {activeSacco.program === 'emyooga' && '📋 Emyooga: Revolving fund · 10% interest · Enterprise-linked loans'}
          {activeSacco.program === 'owc' && '📋 OWC: Crop-cycle repayment · 8% interest · Linked to harvest season'}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#F1F5F9', margin: '16px 20px 0', borderRadius: '12px', padding: '4px' }}>
        {tabs.map(({ key, label }) => {
          const count = loans.filter(l => tabs.find(t=>t.key===key)?.statuses.includes(l.status)).length;
          return (
            <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding:'8px 4px', border:'none', borderRadius:'9px', fontWeight:'700', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', background:tab===key?'white':'transparent', color:tab===key?'#1D4ED8':'#6B7280', boxShadow:tab===key?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
              {label} {count > 0 && <span style={{ background: tab===key?'#EFF6FF':'#E2E8F0', color: tab===key?'#1D4ED8':'#6B7280', borderRadius:'10px', padding:'1px 6px', fontSize:'10px', marginLeft:'3px' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(loan => {
            const member = members.find(m => m.id === loan.memberId);
            const statusColor = loanStatusColor(loan.status);
            const totalDue = loan.amount * (1 + loan.interestRate / 100);
            return (
              <button key={loan.id} onClick={() => openLoan(loan)}
                className="card"
                style={{ padding: '14px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', border:'none', width:'100%', textAlign:'left', background:'white', borderLeft: `4px solid ${statusColor}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'14px', fontWeight:'700', color:'#111827' }}>{member?.name || 'Unknown'}</span>
                    <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px', background: statusColor+'18', color: statusColor, textTransform:'capitalize' }}>{loan.status}</span>
                  </div>
                  <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'3px', display:'flex', gap:'8px' }}>
                    <span>{formatUGX(loan.amount)}</span>
                    <span>·</span>
                    <span>{loan.interestRate}% interest</span>
                    {loan.dueDate && <><span>·</span><span>Due {loan.dueDate}</span></>}
                  </div>
                  <div style={{ fontSize:'11.5px', color:'#9CA3AF', marginTop:'2px', fontStyle:'italic' }}>{loan.purpose}</div>
                  {/* Repayment progress */}
                  <RepayProgress loanId={loan.id} total={totalDue} />
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'#CBD5E1' }}>
              <CreditCard size={40} style={{ margin:'0 auto 8px', opacity:0.4 }} />
              <div style={{ fontSize:'14px', color:'#9CA3AF' }}>No {tab} loans</div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Loan Modal */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Loan Application">
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <label className="label">Member *</label>
            <select className="select" value={form.memberId} onChange={e => setForm(f=>({...f,memberId:e.target.value}))}>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Loan Amount (UGX) *</label>
            <input className="input" type="number" placeholder={activeSacco.program==='pdm'?'Max 1,000,000':'e.g. 500,000'} value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
            {activeSacco.program === 'pdm' && <div style={{ fontSize:'11px', color:'#F59E0B', marginTop:'4px' }}>⚠️ PDM maximum: UGX 1,000,000 per household</div>}
          </div>
          <div>
            <label className="label">Purpose *</label>
            <input className="input" placeholder="e.g. Stock for market stall" value={form.purpose} onChange={e => setForm(f=>({...f,purpose:e.target.value}))} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div>
              <label className="label">Interest Rate (%)</label>
              <input className="input" type="number" value={form.interestRate} onChange={e => setForm(f=>({...f,interestRate:e.target.value}))} />
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f=>({...f,dueDate:e.target.value}))} />
            </div>
          </div>
          {activeSacco.program === 'owc' && (
            <div>
              <label className="label">Crop Cycle (OWC)</label>
              <select className="select" value={form.cropCycle} onChange={e => setForm(f=>({...f,cropCycle:e.target.value}))}>
                <option value="">Not crop-linked</option>
                <option value="maize">Maize (harvest June/Dec)</option>
                <option value="beans">Beans (harvest May/Nov)</option>
                <option value="coffee">Coffee (harvest Oct–Jan)</option>
                <option value="cassava">Cassava (harvest anytime)</option>
              </select>
            </div>
          )}
          {form.amount && form.interestRate && (
            <div style={{ background:'#EFF6FF', borderRadius:'12px', padding:'12px', fontSize:'13px', color:'#1D4ED8' }}>
              <strong>Total repayable:</strong> {formatUGX(Number(form.amount) * (1 + Number(form.interestRate)/100))}
            </div>
          )}
          <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
            <button className="btn-secondary" onClick={() => setShowApply(false)}>Cancel</button>
            <button className="btn-primary" onClick={applyLoan} disabled={saving}>{saving?'Saving…':'Submit Application'}</button>
          </div>
        </div>
      </Modal>

      {/* Loan Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Loan Details">
        {selected && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'flex', gap:'8px' }}>
              <span style={{ fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'20px', background: loanStatusColor(selected.status)+'18', color: loanStatusColor(selected.status), textTransform:'capitalize' }}>{selected.status}</span>
              {selected.cropCycle && <span style={{ fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'20px', background:'#FFFBEB', color:'#D97706' }}>🌾 {selected.cropCycle}</span>}
            </div>

            <div style={{ background:'#F8FAFC', borderRadius:'14px', padding:'14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {[
                { label:'Loan Amount', value: formatUGX(selected.amount) },
                { label:'Interest', value: `${selected.interestRate}%` },
                { label:'Total Due', value: formatUGX(selected.amount*(1+selected.interestRate/100)) },
                { label:'Due Date', value: selected.dueDate || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize:'10px', color:'#9CA3AF', fontWeight:'600' }}>{label}</div>
                  <div style={{ fontSize:'14px', fontWeight:'800', color:'#111827' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'12px' }}>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', marginBottom:'8px' }}>PURPOSE</div>
              <div style={{ fontSize:'14px', color:'#374151' }}>{selected.purpose}</div>
            </div>

            {/* Repayments list */}
            {repayments.length > 0 && (
              <div>
                <div style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', marginBottom:'8px' }}>REPAYMENTS ({repayments.length})</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {repayments.map(r => (
                    <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#DCFCE7', borderRadius:'10px' }}>
                      <span style={{ fontSize:'12px', color:'#374151' }}>{r.date} {r.notes && `· ${r.notes}`}</span>
                      <span style={{ fontSize:'13px', fontWeight:'700', color:'#16A34A' }}>+{formatUGX(r.amount)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:'12px', color:'#16A34A', fontWeight:'700', marginTop:'8px', textAlign:'right' }}>
                  Total repaid: {formatUGX(repayments.reduce((a,r)=>a+r.amount,0))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {STATUS_FLOW[selected.status]?.includes('approved') && (
                <button className="btn-primary" onClick={() => updateStatus(selected,'approved')}><CheckCircle size={16} /> Approve Loan</button>
              )}
              {STATUS_FLOW[selected.status]?.includes('active') && (
                <button className="btn-accent" onClick={() => updateStatus(selected,'active')}><Banknote size={16} /> Mark Disbursed</button>
              )}
              {(selected.status === 'active' || selected.status === 'overdue') && (
                <button className="btn-primary" style={{ background:'#16A34A' }} onClick={() => { setShowRepay(true); }}>
                  <Plus size={16} /> Record Repayment
                </button>
              )}
              {STATUS_FLOW[selected.status]?.includes('rejected') && (
                <button className="btn-danger" onClick={() => updateStatus(selected,'rejected')}><XCircle size={16} /> Reject</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Repayment Modal */}
      <Modal open={showRepay} onClose={() => setShowRepay(false)} title="Record Repayment">
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {selected && (
            <div style={{ background:'#EFF6FF', borderRadius:'12px', padding:'12px', fontSize:'13px', color:'#1D4ED8' }}>
              Total due: <strong>{formatUGX(selected.amount*(1+selected.interestRate/100))}</strong> · Repaid: <strong>{formatUGX(repayments.reduce((a,r)=>a+r.amount,0))}</strong>
            </div>
          )}
          <div>
            <label className="label">Amount (UGX) *</label>
            <input className="input" type="number" placeholder="e.g. 100,000" value={repayForm.amount} onChange={e => setRepayForm(f=>({...f,amount:e.target.value}))} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={repayForm.date} onChange={e => setRepayForm(f=>({...f,date:e.target.value}))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" placeholder="e.g. Mobile Money payment" value={repayForm.notes} onChange={e => setRepayForm(f=>({...f,notes:e.target.value}))} />
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button className="btn-secondary" onClick={() => setShowRepay(false)}>Cancel</button>
            <button className="btn-primary" style={{ background:'#16A34A' }} onClick={recordRepayment} disabled={saving}>{saving?'Saving…':'Record Payment'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RepayProgress({ loanId, total }) {
  const [repaid, setRepaid] = useState(0);
  useEffect(() => {
    db.repayments.where({ loanId }).toArray().then(rs => setRepaid(rs.reduce((a,r)=>a+r.amount,0)));
  }, [loanId]);
  const pct = Math.min(100, (repaid / total) * 100);
  if (repaid === 0) return null;
  return (
    <div style={{ marginTop:'6px' }}>
      <div style={{ height:'4px', background:'#E2E8F0', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background: pct>=100?'#16A34A':'#3B82F6', borderRadius:'2px' }} />
      </div>
      <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'2px' }}>{Math.round(pct)}% repaid</div>
    </div>
  );
}

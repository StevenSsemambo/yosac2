import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db, getMemberBalance, formatUGX } from '../db';
import Modal from '../components/Modal';
import { UserPlus, Search, User, Phone, CreditCard, ChevronRight, CheckCircle, XCircle, PiggyBank, AlertTriangle } from 'lucide-react';

export default function Members() {
  const { activeSacco, showToast } = useApp();
  const [members, setMembers] = useState([]);
  const [search, setSearch]   = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);

  const [form, setForm] = useState({ name:'', nin:'', phone:'', role:'member' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (activeSacco) loadMembers(); }, [activeSacco]);

  async function loadMembers() {
    const list = await db.members.where({ saccoId: activeSacco.id }).toArray();
    setMembers(list);
  }

  async function openMember(m) {
    setSelected(m);
    const bal = await getMemberBalance(m.id);
    setMemberDetail(bal);
  }

  async function addMember() {
    if (!form.name || !form.nin || !form.phone) return showToast('Fill all required fields', 'error');
    setSaving(true);
    await db.members.add({ ...form, saccoId: activeSacco.id, status: 'active', joinedAt: new Date().toISOString() });
    await db.transactions.add({ saccoId: activeSacco.id, type: 'member_join', amount: 0, description: `${form.name} joined as ${form.role}`, createdAt: new Date().toISOString() });
    showToast(`${form.name} added successfully`);
    setForm({ name:'', nin:'', phone:'', role:'member' });
    setShowAdd(false);
    setSaving(false);
    loadMembers();
  }

  async function toggleStatus(m) {
    const newStatus = m.status === 'active' ? 'inactive' : 'active';
    await db.members.update(m.id, { status: newStatus });
    showToast(`${m.name} marked as ${newStatus}`);
    loadMembers();
    setSelected(null);
  }

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search) || (m.nin && m.nin.includes(search))
  );

  if (!activeSacco) return <EmptyState />;

  return (
    <div style={{ paddingBottom: '80px' }} className="page-enter">

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)', padding: '52px 20px 20px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.65, fontWeight: '600', letterSpacing: '0.06em' }}>MEMBERS</div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0 0' }}>{members.length} Members</h1>
            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>{members.filter(m=>m.status==='active').length} active</div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ background: '#F59E0B', border: 'none', borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <UserPlus size={16} /> Add
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input" placeholder="Search by name, NIN, phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '40px' }} />
        </div>

        {/* Member list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(m => (
            <button key={m.id} onClick={() => openMember(m)}
              className="card"
              style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', background: 'white' }}>
              {/* Avatar */}
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: m.status === 'active' ? '#EFF6FF' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={20} color={m.status === 'active' ? '#1D4ED8' : '#9CA3AF'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{m.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: m.status === 'active' ? '#DCFCE7' : '#F3F4F6', color: m.status === 'active' ? '#16A34A' : '#9CA3AF' }}>
                    {m.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                  {m.role.charAt(0).toUpperCase() + m.role.slice(1)} · {m.phone}
                </div>
                {m.nin && <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace', marginTop: '2px' }}>NIN: {m.nin}</div>}
              </div>
              <ChevronRight size={16} color="#CBD5E1" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
              <User size={40} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px' }}>No members found</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Member">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="e.g. Grace Namukasa" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          </div>
          <div>
            <label className="label">National ID (NIN) *</label>
            <input className="input" placeholder="e.g. CM87001200XYA" value={form.nin} onChange={e => setForm(f => ({...f, nin: e.target.value.toUpperCase()}))} style={{ fontFamily: 'monospace' }} />
          </div>
          <div>
            <label className="label">Phone Number *</label>
            <input className="input" placeholder="e.g. 0772 100 001" type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="select" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
              <option value="member">Member</option>
              <option value="chairperson">Chairperson</option>
              <option value="treasurer">Treasurer</option>
              <option value="secretary">Secretary</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" onClick={addMember} disabled={saving}>
              {saving ? 'Saving…' : 'Add Member'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Member Detail Modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setMemberDetail(null); }} title={selected?.name || ''}>
        {selected && memberDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Role badge */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', background: '#EFF6FF', color: '#1D4ED8', padding: '4px 12px', borderRadius: '20px' }}>
                {selected.role}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', background: selected.status==='active'?'#DCFCE7':'#F3F4F6', color: selected.status==='active'?'#16A34A':'#9CA3AF', padding: '4px 12px', borderRadius: '20px' }}>
                {selected.status}
              </span>
            </div>

            {/* Info rows */}
            {[
              { Icon: Phone, label: 'Phone', value: selected.phone },
              { Icon: CreditCard, label: 'NIN', value: selected.nin, mono: true },
              { Icon: User, label: 'Joined', value: new Date(selected.joinedAt).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric' }) },
            ].map(({ Icon, label, value, mono }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ background: '#F1F5F9', borderRadius: '10px', padding: '8px' }}><Icon size={16} color="#6B7280" /></div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
                </div>
              </div>
            ))}

            {/* Balance stats */}
            <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '10px' }}>ACCOUNT SUMMARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Savings', value: formatUGX(memberDetail.totalSavings), color: '#16A34A', Icon: PiggyBank },
                  { label: 'Shares', value: formatUGX(memberDetail.totalShares), color: '#7C3AED', Icon: CreditCard },
                  { label: 'Loan Owed', value: formatUGX(memberDetail.totalOwed), color: '#DC2626', Icon: AlertTriangle },
                  { label: 'Repaid', value: formatUGX(memberDetail.totalRepaid), color: '#D97706', Icon: CheckCircle },
                ].map(({ label, value, color, Icon: Ic }) => (
                  <div key={label} style={{ background: 'white', borderRadius: '10px', padding: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <Ic size={12} color={color} />
                      <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '600' }}>{label}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className={selected.status === 'active' ? 'btn-danger' : 'btn-secondary'} onClick={() => toggleStatus(selected)}>
              {selected.status === 'active' ? <><XCircle size={16} /> Deactivate Member</> : <><CheckCircle size={16} /> Reactivate Member</>}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <User size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: '#6B7280' }}>Select or create a SACCO first</p>
    </div>
  );
}

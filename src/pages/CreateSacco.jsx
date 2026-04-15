import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import { Building2, MapPin, User, Phone, ChevronRight, CheckCircle } from 'lucide-react';

const PROGRAMS = [
  { value:'emyooga', label:'Emyooga', desc:'Presidential wealth creation · 19 enterprise categories · UGX 30–50M seed capital', color:'#7C3AED', bg:'#F5F3FF' },
  { value:'pdm',     label:'PDM',     desc:'Parish Development Model · Revolving fund · 6% interest cap · UGX 100M per parish', color:'#16A34A', bg:'#F0FDF4' },
  { value:'owc',     label:'OWC',     desc:'Operation Wealth Creation · Commercial agriculture · Crop-cycle repayments', color:'#D97706', bg:'#FFFBEB' },
];

const ENTERPRISES = ['Market Vendors','Boda Boda Riders','Salon Operators','Tailors & Seamstresses','Carpenters','Welders','Journalists','Teachers','Produce Traders','Farmers','Fishermen','Poultry Keepers','Elected Leaders','Youth','Women Entrepreneurs','Other'];

export default function CreateSacco() {
  const { refreshSaccos, setActiveSacco, showToast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=program, 2=details, 3=leadership
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    program:'', name:'', district:'', parish:'', constituency:'', enterprise:'',
    registrationNo:'', phone:'',
    chairperson:'', treasurer:'', secretary:'',
  });

  function f(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function submit() {
    if (!form.chairperson || !form.treasurer) return showToast('Add chairperson and treasurer', 'error');
    setSaving(true);
    const id = await db.saccos.add({ ...form, status:'active', createdAt: new Date().toISOString() });
    const sacco = await db.saccos.get(id);
    await refreshSaccos();
    setActiveSacco(sacco);
    showToast(`${form.name} created!`);
    navigate('/');
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', paddingBottom:'40px' }} className="page-enter">

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)', padding:'52px 20px 24px', color:'white' }}>
        <div style={{ fontSize:'11px', opacity:0.65, fontWeight:'600', letterSpacing:'0.06em', marginBottom:'6px' }}>NEW SACCO REGISTRATION</div>
        <h1 style={{ fontSize:'22px', fontWeight:'800', margin:0 }}>Register Your SACCO</h1>
        <div style={{ fontSize:'12px', opacity:0.7, marginTop:'4px' }}>YoSacco · SayMyTech Developers</div>
        {/* Steps */}
        <div style={{ display:'flex', gap:'6px', marginTop:'16px' }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex:1, height:'4px', borderRadius:'2px', background: s<=step ? '#F59E0B' : 'rgba(255,255,255,0.2)', transition:'background 0.3s' }} />
          ))}
        </div>
        <div style={{ fontSize:'11px', opacity:0.7, marginTop:'6px' }}>
          Step {step} of 3 — {['Programme Type','SACCO Details','Leadership'][step-1]}
        </div>
      </div>

      <div style={{ padding:'24px 20px' }}>

        {/* STEP 1: Programme */}
        {step === 1 && (
          <div className="page-enter">
            <div style={{ fontSize:'15px', fontWeight:'800', color:'#111827', marginBottom:'6px' }}>Which programme is this SACCO under?</div>
            <div style={{ fontSize:'13px', color:'#6B7280', marginBottom:'20px' }}>This determines loan rules, interest rates, and compliance checks.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {PROGRAMS.map(p => (
                <button key={p.value} onClick={() => f('program', p.value)}
                  style={{ background: form.program===p.value ? p.bg : 'white', border: `2px solid ${form.program===p.value ? p.color : '#E2E8F0'}`, borderRadius:'16px', padding:'16px', textAlign:'left', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:'14px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background: p.bg, border:`1.5px solid ${p.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:'18px', fontWeight:'900', color:p.color }}>{p.label[0]}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'15px', fontWeight:'800', color:'#111827' }}>{p.label}</div>
                    <div style={{ fontSize:'11.5px', color:'#6B7280', marginTop:'3px', lineHeight:1.4 }}>{p.desc}</div>
                  </div>
                  {form.program===p.value && <CheckCircle size={20} color={p.color} style={{ flexShrink:0 }} />}
                </button>
              ))}
            </div>
            <button className="btn-primary" disabled={!form.program} onClick={() => setStep(2)} style={{ marginTop:'24px' }}>
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: SACCO Details */}
        {step === 2 && (
          <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label className="label">SACCO Name *</label>
              <input className="input" placeholder="e.g. Nakawa Traders Emyooga SACCO" value={form.name} onChange={e => f('name',e.target.value)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div>
                <label className="label">District *</label>
                <input className="input" placeholder="e.g. Kampala" value={form.district} onChange={e => f('district',e.target.value)} />
              </div>
              <div>
                <label className="label">Parish *</label>
                <input className="input" placeholder="e.g. Nakawa" value={form.parish} onChange={e => f('parish',e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Constituency</label>
              <input className="input" placeholder="e.g. Nakawa Division" value={form.constituency} onChange={e => f('constituency',e.target.value)} />
            </div>
            {form.program === 'emyooga' && (
              <div>
                <label className="label">Enterprise Category</label>
                <select className="select" value={form.enterprise} onChange={e => f('enterprise',e.target.value)}>
                  <option value="">Select enterprise…</option>
                  {ENTERPRISES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Registration Number</label>
              <input className="input" placeholder="e.g. EMY/KLA/2021/0045" value={form.registrationNo} onChange={e => f('registrationNo',e.target.value)} style={{ fontFamily:'monospace' }} />
            </div>
            <div>
              <label className="label">SACCO Phone</label>
              <input className="input" type="tel" placeholder="e.g. 0772 123 456" value={form.phone} onChange={e => f('phone',e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" disabled={!form.name||!form.district||!form.parish} onClick={() => setStep(3)}>Continue <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* STEP 3: Leadership */}
        {step === 3 && (
          <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ fontSize:'13px', color:'#6B7280', marginBottom:'4px' }}>
              Add the SACCO's leadership team. These names will appear on all accountability reports.
            </div>
            {[
              { key:'chairperson', label:'Chairperson *', placeholder:'Full name' },
              { key:'treasurer',   label:'Treasurer *',   placeholder:'Full name' },
              { key:'secretary',   label:'Secretary',     placeholder:'Full name (optional)' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <div style={{ position:'relative' }}>
                  <User size={15} color="#9CA3AF" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }} />
                  <input className="input" style={{ paddingLeft:'40px' }} placeholder={placeholder} value={form[key]} onChange={e => f(key,e.target.value)} />
                </div>
              </div>
            ))}

            {/* Summary */}
            <div style={{ background:'#F8FAFC', borderRadius:'14px', padding:'14px', marginTop:'4px', border:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', marginBottom:'10px' }}>REGISTRATION SUMMARY</div>
              {[
                { label:'Programme', value: PROGRAMS.find(p=>p.value===form.program)?.label },
                { label:'Name',      value: form.name },
                { label:'Location',  value: `${form.parish}, ${form.district}` },
              ].map(({ label, value }) => value && (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F1F5F9', fontSize:'13px' }}>
                  <span style={{ color:'#9CA3AF', fontWeight:'600' }}>{label}</span>
                  <span style={{ fontWeight:'700', color:'#111827' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={submit} disabled={saving||!form.chairperson||!form.treasurer}>
                {saving ? 'Creating…' : '🚀 Create SACCO'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

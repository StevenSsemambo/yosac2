import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'relative', background: 'white',
        borderRadius: '24px 24px 0 0', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.25s ease-out',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 8px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#111827', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: '#F1F5F9', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>
        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '8px 20px 32px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

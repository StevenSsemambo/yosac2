import { useApp } from '../context/AppContext';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const colors = {
    success: { bg: '#16A34A', Icon: CheckCircle },
    error:   { bg: '#DC2626', Icon: XCircle },
    info:    { bg: '#2563EB', Icon: Info },
  };
  const { bg, Icon } = colors[toast.type] || colors.info;

  return (
    <div style={{
      position: 'fixed', top: '16px', left: '16px', right: '16px',
      background: bg, color: 'white', borderRadius: '12px',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
      zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      animation: 'slideUp 0.2s ease-out', fontSize: '14px', fontWeight: '600',
    }}>
      <Icon size={18} />
      {toast.msg}
    </div>
  );
}

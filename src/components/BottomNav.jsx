import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, PiggyBank, CreditCard, BarChart3 } from 'lucide-react';

const tabs = [
  { path: '/',         label: 'Home',    Icon: LayoutDashboard },
  { path: '/members',  label: 'Members', Icon: Users },
  { path: '/savings',  label: 'Savings', Icon: PiggyBank },
  { path: '/loans',    label: 'Loans',   Icon: CreditCard },
  { path: '/reports',  label: 'Reports', Icon: BarChart3 },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid #E2E8F0',
      display: 'flex', justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      paddingTop: '6px',
      zIndex: 50,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
    }}>
      {tabs.map(({ path, label, Icon }) => {
        const active = pathname === path || (path !== '/' && pathname.startsWith(path));
        return (
          <button key={path} onClick={() => navigate(path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '6px 12px', background: 'none', border: 'none',
              cursor: 'pointer', color: active ? '#1D4ED8' : '#9CA3AF',
              fontSize: '10px', fontWeight: active ? '700' : '500',
              fontFamily: 'inherit', transition: 'color 0.15s',
              position: 'relative',
            }}>
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '32px', height: '3px', background: '#1D4ED8',
                borderRadius: '0 0 4px 4px',
              }} />
            )}
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

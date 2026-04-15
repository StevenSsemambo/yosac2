import { Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav   from './components/BottomNav';
import Toast       from './components/Toast';
import Dashboard   from './pages/Dashboard';
import Members     from './pages/Members';
import Savings     from './pages/Savings';
import Loans       from './pages/Loans';
import Reports     from './pages/Reports';
import CreateSacco from './pages/CreateSacco';

function AppShell() {
  const { loading } = useApp();
  const location    = useLocation();
  const hideNav     = location.pathname === '/create-sacco';

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1E3A8A,#1D4ED8)', gap:'16px' }}>
      <div style={{ fontSize:'28px', fontWeight:'900', color:'white', letterSpacing:'-0.03em' }}>YoSacco</div>
      <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', fontWeight:'600' }}>by SayMyTech Developers</div>
      <div style={{ width:'40px', height:'3px', background:'rgba(255,255,255,0.3)', borderRadius:'2px', overflow:'hidden', marginTop:'8px' }}>
        <div style={{ height:'100%', background:'#F59E0B', borderRadius:'2px', animation:'loadbar 1.4s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes loadbar { 0%{width:0;margin-left:0} 50%{width:100%;margin-left:0} 100%{width:0;margin-left:100%} }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth:'480px', margin:'0 auto', minHeight:'100vh', position:'relative', background:'#F8FAFC' }}>
      <Toast />
      <Routes>
        <Route path="/"             element={<Dashboard />} />
        <Route path="/members"      element={<Members />} />
        <Route path="/savings"      element={<Savings />} />
        <Route path="/loans"        element={<Loans />} />
        <Route path="/reports"      element={<Reports />} />
        <Route path="/create-sacco" element={<CreateSacco />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

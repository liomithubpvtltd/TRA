import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Wallet, 
  Settings, 
  LogOut, 
  PieChart, 
  TrendingUp, 
  Target,
  ChevronRight,
  Lock,
  Zap,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'plan' | 'security'>('overview');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const capitalStats = [
    { label: 'Net Available', value: `$${(user?.balance || 0).toLocaleString()}`, icon: <Wallet size={16} /> },
    { label: 'Allocated Capital', value: '$45,000', icon: <Target size={16} /> },
    { label: 'Avg Monthly ROI', value: '+12.4%', icon: <TrendingUp size={16} /> },
  ];

  return (
    <div style={{ ...containerStyle, padding: isMobile ? '80px 16px 120px' : '40px 24px 80px' }}>
      <header style={headerStyle}>
        <div style={profileHeaderLeft}>
          <div style={avatarWrapper}>
            <div style={avatar}>{user?.name?.[0] || 'U'}</div>
            <div style={onlineIndicator} />
          </div>
          <div>
            <h1 style={userNameStyle}>{user?.name || 'Administrator'}</h1>
            <p style={userEmailStyle}>{user?.email || 'admin@vision.ai'}</p>
          </div>
        </div>
        <button style={logoutBtn} onClick={logout}><LogOut size={16} /> SIGN OUT</button>
      </header>

      {/* Tabs */}
      <div style={tabSwitcher}>
        <button style={subTabBtn(activeSubTab === 'overview')} onClick={() => setActiveSubTab('overview')}>OVERVIEW</button>
        <button style={subTabBtn(activeSubTab === 'plan')} onClick={() => setActiveSubTab('plan')}>FUND MANAGEMENT PLAN</button>
        <button style={subTabBtn(activeSubTab === 'security')} onClick={() => setActiveSubTab('security')}>SECURITY & PRIVACY</button>
      </div>

      <div style={contentGrid}>
        {activeSubTab === 'overview' && (
          <>
            <div style={mainColumn}>
              <h2 style={sectionTitle}>CAPITAL OVERVIEW</h2>
              <div style={statsRow}>
                {capitalStats.map((s, i) => (
                  <GlassCard key={i} style={statItem}>
                    <div style={statIcon}>{s.icon}</div>
                    <div>
                      <div style={statLabel}>{s.label}</div>
                      <div style={statValue}>{s.value}</div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              <h2 style={sectionTitle}>PERFORMANCE ANALYTICS</h2>
              <GlassCard style={performanceCard}>
                 <div style={perfHeader}>
                   <div>
                     <h3 style={perfTitle}>Account Growth Velocity</h3>
                     <p style={perfSubtitle}>Tracking institutional scaling across current quarter.</p>
                   </div>
                   <div style={roiBadge}>+24.5% ANNUALIZED</div>
                 </div>
                 <div style={chartPlaceholder}>
                    <BarChart2 size={48} color="rgba(255,255,255,0.05)" />
                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: 900, marginTop: '12px' }}>AI ANALYTICS ENGINE CONNECTED</span>
                 </div>
              </GlassCard>
            </div>

            <div style={sideColumn}>
               <h2 style={sectionTitle}>ACCOUNT STATUS</h2>
               <GlassCard style={accountStatusCard}>
                  <div style={statusRow}>
                    <span style={statusLabel}>Account Type</span>
                    <span style={statusVal}>INSTITUTIONAL</span>
                  </div>
                  <div style={statusRow}>
                    <span style={statusLabel}>Verification</span>
                    <span style={statusValSuccess}>VERIFIED</span>
                  </div>
                  <div style={statusRow}>
                    <span style={statusLabel}>Country</span>
                    <span style={statusVal}>INDIA</span>
                  </div>
                  <div style={statusRow}>
                    <span style={statusLabel}>Member Since</span>
                    <span style={statusVal}>MAY 2026</span>
                  </div>
               </GlassCard>

               <h2 style={sectionTitle}>QUICK ACTIONS</h2>
               <div style={actionList}>
                  <button style={actionItem}><Lock size={14} /> Update Password <ChevronRight size={14} /></button>
                  <button style={actionItem}><Zap size={14} /> API Integrations <ChevronRight size={14} /></button>
                  <button style={actionItem}><Settings size={14} /> System Settings <ChevronRight size={14} /></button>
               </div>
            </div>
          </>
        )}

        {activeSubTab === 'plan' && (
          <div style={fullColumn}>
             <h2 style={sectionTitle}>STRATEGIC FUND MANAGEMENT PLAN (FMP)</h2>
             <div style={fmpContainer}>
                <div style={fmpGrid}>
                   <GlassCard style={planCard}>
                      <PieChart size={24} color="#d4af37" style={{ marginBottom: '16px' }} />
                      <h3 style={planHeading}>Risk Allocation</h3>
                      <p style={planDesc}>Currently maintaining a conservative 1-2% risk per signal threshold to preserve capital alpha.</p>
                      <div style={allocationBar}><div style={allocationProgress('40%')} /></div>
                      <div style={allocationStats}>
                        <span>STABLE: 60%</span>
                        <span>AGGRESSIVE: 40%</span>
                      </div>
                   </GlassCard>

                   <GlassCard style={planCard}>
                      <TrendingUp size={24} color="#10b981" style={{ marginBottom: '16px' }} />
                      <h3 style={planHeading}>Compounding Roadmap</h3>
                      <p style={planDesc}>Targeting a 5% weekly growth with automated profit withdrawal at key resistance milestones.</p>
                      <div style={milestoneList}>
                         <div style={milestone}><div style={chkDone} /> 10k Milestone</div>
                         <div style={milestone}><div style={chkDone} /> 50k Milestone</div>
                         <div style={milestone}><div style={chkPending} /> 100k Institutional Scale</div>
                      </div>
                   </GlassCard>

                   <GlassCard style={planCard}>
                      <Shield size={24} color="#3b82f6" style={{ marginBottom: '16px' }} />
                      <h3 style={planHeading}>Drawdown Shield</h3>
                      <p style={planDesc}>Automated cooling-off period active if account drawdown exceeds 5.0% in a single trading session.</p>
                      <div style={shieldStat}>
                        <span style={sLabel}>MAX DD LIMIT</span>
                        <span style={sVal}>5.0%</span>
                      </div>
                   </GlassCard>
                </div>

                <div style={planFinalRow}>
                   <h2 style={sectionTitle}>ACTIVE MANAGEMENT NOTES</h2>
                   <GlassCard style={notesCard}>
                      "The current fund management strategy is optimized for XAUUSD volatility. Capital is distributed across 3 asset classes with a priority on bullion preserve. Autonomous trading is enabled for signals with probability &gt; 85%."
                   </GlassCard>
                </div>
             </div>
          </div>
        )}

        {activeSubTab === 'security' && (
           <div style={fullColumn}>
              <h2 style={sectionTitle}>SECURITY SETTINGS</h2>
              <div style={securityList}>
                 <GlassCard style={securityItem}>
                    <div style={secInfo}>
                       <h3 style={secTitle}>Two-Factor Authentication (2FA)</h3>
                       <p style={secDesc}>Add an extra layer of security to your transactional registers.</p>
                    </div>
                    <div style={toggleOn}>ACTIVE</div>
                 </GlassCard>
                 <GlassCard style={securityItem}>
                    <div style={secInfo}>
                       <h3 style={secTitle}>Withdrawal Whitelist</h3>
                       <p style={secDesc}>Restrict fund disbursements to trusted addresses ONLY.</p>
                    </div>
                    <button style={secBtn}>SETUP</button>
                 </GlassCard>
                 <GlassCard style={securityItem}>
                    <div style={secInfo}>
                       <h3 style={secTitle}>Session History</h3>
                       <p style={secDesc}>Review all active logins and geographical IP overlaps.</p>
                    </div>
                    <button style={secBtn}>VIEW LOGS</button>
                 </GlassCard>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}

// STYLES
const containerStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' };
const profileHeaderLeft: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '20px' };
const avatarWrapper: React.CSSProperties = { position: 'relative' };
const avatar: React.CSSProperties = { width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #d4af37, #b38728)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900, color: '#050b14' };
const onlineIndicator: React.CSSProperties = { position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#10b981', border: '3px solid #050b14' };
const userNameStyle: React.CSSProperties = { fontSize: '28px', fontWeight: 900, color: '#f8fafc', margin: 0 };
const userEmailStyle: React.CSSProperties = { fontSize: '14px', color: '#64748b', margin: '4px 0 0', fontWeight: 500 };
const logoutBtn: React.CSSProperties = { background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', padding: '12px 24px', borderRadius: '14px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };

const tabSwitcher: React.CSSProperties = { display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' };
const subTabBtn = (active: boolean): React.CSSProperties => ({
  background: 'none', border: 'none', padding: '0 0 12px 0', borderBottom: active ? '2px solid #d4af37' : '2px solid transparent', color: active ? '#f8fafc' : '#64748b', fontSize: '11px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.1em'
});

const contentGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' };
const mainColumn: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '24px' };
const sideColumn: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '24px' };
const fullColumn: React.CSSProperties = { gridColumn: 'span 2' };

const sectionTitle: React.CSSProperties = { fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.15em', marginBottom: '8px', textTransform: 'uppercase' };
const statsRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' };
const statItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'rgba(5,10,20,0.3)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)' };
const statIcon: React.CSSProperties = { padding: '8px', borderRadius: '10px', background: 'rgba(212,175,55,0.1)', color: '#d4af37' };
const statLabel: React.CSSProperties = { fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' };
const statValue: React.CSSProperties = { fontSize: '18px', fontWeight: 900, color: '#f8fafc' };

const performanceCard: React.CSSProperties = { padding: '24px', height: '300px', display: 'flex', flexDirection: 'column' };
const perfHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' };
const perfTitle: React.CSSProperties = { fontSize: '14px', fontWeight: 900, color: '#f8fafc' };
const perfSubtitle: React.CSSProperties = { fontSize: '12px', color: '#64748b', marginTop: '4px' };
const roiBadge: React.CSSProperties = { background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900 };
const chartPlaceholder: React.CSSProperties = { flex: 1, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };

const accountStatusCard: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' };
const statusRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const statusLabel: React.CSSProperties = { fontSize: '13px', color: '#64748b', fontWeight: 500 };
const statusVal: React.CSSProperties = { fontSize: '12px', fontWeight: 900, color: '#f8fafc' };
const statusValSuccess: React.CSSProperties = { display: 'flex', fontSize: '12px', fontWeight: 900, color: '#10b981' };

const actionList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const actionItem: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };

const fmpContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '24px' };
const fmpGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' };
const planCard: React.CSSProperties = { padding: '24px', minHeight: '240px' };
const planHeading: React.CSSProperties = { fontSize: '16px', fontWeight: 900, color: '#f8fafc', marginBottom: '8px' };
const planDesc: React.CSSProperties = { fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' };

const allocationBar: React.CSSProperties = { height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' };
const allocationProgress = (w: string): React.CSSProperties => ({ width: w, height: '100%', background: '#d4af37' });
const allocationStats: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900, color: '#475569' };

const milestoneList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const milestone: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 700, color: '#94a3b8' };
const chkDone: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%', background: '#10b981' };
const chkPending: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%', background: '#475569' };

const shieldStat: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '20px' };
const sLabel: React.CSSProperties = { fontSize: '10px', fontWeight: 800, color: '#475569' };
const sVal: React.CSSProperties = { fontSize: '24px', fontWeight: 900, color: '#f43f5e' };

const planFinalRow: React.CSSProperties = { marginTop: '16px' };
const notesCard: React.CSSProperties = { padding: '24px', fontSize: '14px', color: '#94a3b8', lineHeight: 1.8, fontStyle: 'italic', background: 'rgba(212,175,55,0.02)' };

const securityList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' };
const securityItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' };
const secInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const secTitle: React.CSSProperties = { fontSize: '15px', fontWeight: 900, color: '#f8fafc' };
const secDesc: React.CSSProperties = { fontSize: '13px', color: '#64748b' };
const toggleOn: React.CSSProperties = { background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 900 };
const secBtn: React.CSSProperties = { background: '#1e293b', color: '#f8fafc', border: 'none', padding: '8px 18px', borderRadius: '10px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' };

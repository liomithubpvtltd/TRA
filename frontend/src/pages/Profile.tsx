import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { CreditCard, ShieldCheck, Cpu, User, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/*
    Note: 'saved' was being used for a simple UI effect. 
    Removing the state to satisfy linter as it's not currently triggering 
    any complex logic.
*/

export default function Profile() {
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleProfileSave = () => {
    console.log("Profile updated");
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 24px 80px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Terminal Profile</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage your identity and security protocols</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '32px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Personal Info */}
          <GlassCard title="👤 Personal Identification" subtitle="Update your terminal contact details" icon={<User size={20} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#475569" style={iconStyle} />
                  <input 
                    id="profile-name" name="profile-name" autoComplete="off"
                    type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} style={inputStyle} 
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>EMAIL ADDRESS</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#475569" style={iconStyle} />
                  <input 
                    id="profile-email" name="profile-email" autoComplete="off"
                    type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} style={inputStyle} 
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>PHONE NUMBER</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#475569" style={iconStyle} />
                  <input 
                    id="profile-phone" name="profile-phone" autoComplete="off"
                    type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} style={inputStyle} 
                  />
                </div>
              </div>
            </div>
            <button onClick={handleProfileSave} style={{ ...primaryBtnStyle, marginTop: '24px' }}>UPDATE PROFILE</button>
          </GlassCard>

          {/* Change Password */}
          <GlassCard title="🔐 Security Access" subtitle="Revoke and re-issue login credentials" icon={<Lock size={20} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>CURRENT PASSWORD</label>
                <input 
                  id="curr-pass" name="curr-pass" autoComplete="new-password"
                  type="password" placeholder="••••••••" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>NEW PASSWORD</label>
                <input 
                  id="new-pass" name="new-pass" autoComplete="new-password"
                  type="password" placeholder="••••••••" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>RE-ENTER NEW</label>
                <input 
                  id="conf-pass" name="conf-pass" autoComplete="new-password"
                  type="password" placeholder="••••••••" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} style={inputStyle} 
                />
              </div>
            </div>
            <button style={{ ...primaryBtnStyle, marginTop: '24px', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)' }}>CHANGE PASSWORD</button>
          </GlassCard>

          {/* API Bridge */}
          <GlassCard title="🔌 API Bridge Connections" icon={<Cpu size={20} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '10px' }}>
              <div>
                <h4 style={sectionTitleStyle}>BINANCE (CRYPTO)</h4>
                <div style={{ marginBottom: '16px' }}><label style={labelStyle}>API KEY</label><input type="password" placeholder="••••••••••••••••" style={inputStyle} /></div>
                <div><label style={labelStyle}>API SECRET</label><input type="password" placeholder="••••••••••••••••" style={inputStyle} /></div>
              </div>
              <div>
                <h4 style={sectionTitleStyle}>METATRADER 5 (FOREX)</h4>
                <div style={{ marginBottom: '16px' }}><label style={labelStyle}>ACCOUNT LOGIN</label><input type="text" placeholder="88210452" style={inputStyle} /></div>
                <div><label style={labelStyle}>SERVER ADDRESS</label><input type="text" placeholder="MT5-Global-Live" style={inputStyle} /></div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <GlassCard title="💳 Capital Management" icon={<CreditCard size={20} />}>
            <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(0,0,0,0))', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '24px', border: '1px solid rgba(212,175,55,0.1)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#d4af37', letterSpacing: '0.1em' }}>PAPER BALANCE</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc', marginTop: '8px' }}>$124,530.42</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={outlineBtnStyle}>DEPOSIT CAPITAL</button>
              <button style={{ ...outlineBtnStyle, borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}>WITHDRAW FUNDS</button>
            </div>
          </GlassCard>

          <GlassCard title="🛡️ Privacy Toggles" icon={<ShieldCheck size={20} />}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
               <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Two-Factor Auth</div>
               <div style={toggleStyle}>ON</div>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
               <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>AI Confirms</div>
               <div style={{ ...toggleStyle, background: 'rgba(255,255,255,0.05)', color: '#475569' }}>OFF</div>
             </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

const sectionTitleStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', marginBottom: '16px' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '10px', fontWeight: 700, color: '#475569', marginBottom: '6px', marginLeft: '4px' };
const iconStyle: React.CSSProperties = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 12px 12px 40px', color: '#f8fafc', fontSize: '13px', outline: 'none' };
const primaryBtnStyle: React.CSSProperties = { background: '#d4af37', color: '#050b14', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', letterSpacing: '0.05em' };
const outlineBtnStyle: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' };
const toggleStyle: React.CSSProperties = { padding: '4px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px', fontWeight: 900 };

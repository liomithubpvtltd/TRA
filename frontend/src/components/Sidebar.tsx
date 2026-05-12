import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, ClipboardList, FileText, Calculator, Settings, Bell, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
  { name: 'Dashboard',   icon: <LayoutDashboard size={20} />, path: '/' },
  { name: 'Portfolio',   icon: <Briefcase size={20} />,       path: '/portfolio' },
  { name: 'Orders',      icon: <ClipboardList size={20} />,   path: '/orders' },
  { name: 'Reports',     icon: <FileText size={20} />,        path: '/reports' },
  { name: 'Calculators', icon: <Calculator size={20} />,      path: '/calculators' },
  { name: 'Settings',    icon: <Settings size={20} />,        path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#050b14',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 0 24px',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      zIndex: 100,
    }}>

      {/* Brand */}
      <div style={{ padding: '0 24px 40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, #d4af37 0%, #9a7d26 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(212,175,55,0.2)'
        }}>
          <span style={{ color: '#050b14', fontWeight: 900, fontSize: '20px' }}>V</span>
        </div>
        <div>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.15em', color: '#f8fafc', display: 'block' }}>VISION</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#d4af37', letterSpacing: '0.1em' }}>AI TRADING</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 16px' }}>
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          const isHov = hovered === item.name;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#f8fafc' : (isHov ? '#d4af37' : '#94a3b8'),
                background: isActive ? 'rgba(212,175,55,0.08)' : (isHov ? 'rgba(255,255,255,0.02)' : 'transparent'),
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: isActive ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={() => setHovered(item.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: isActive || isHov ? '#d4af37' : 'inherit' }}>{item.icon}</span>
                {item.name}
              </div>
              {(isActive || isHov) && (
                <motion.div layoutId="chevron" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                  <ChevronRight size={14} />
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)'
          }}>MM</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Mayank Meralya</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>VIP TRADER</div>
          </div>
          <Bell size={18} color="#64748b" style={{ cursor: 'pointer' }} />
        </div>
      </div>

    </aside>
  );
}


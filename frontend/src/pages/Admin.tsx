import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Users, CheckCircle, XCircle, DollarSign, ShieldAlert, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'pending', balance: 0 },
  { id: 2, name: 'Jane Smith', email: 'jane@smith.io', status: 'approved', balance: 125000 },
  { id: 3, name: 'Tester Bot', email: 'tester@vision.ai', status: 'pending', balance: 0 },
  { id: 4, name: 'Alice Wonder', email: 'alice@crypto.com', status: 'rejected', balance: 0 },
];

export default function Admin() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAction = (id: number, action: 'approved' | 'rejected') => {
    setUsers(users.map(u => u.id === id ? { ...u, status: action } : u));
  };

  const addFunds = (id: number) => {
    const amount = window.prompt("Enter amount to add to wallet:");
    if (amount && !isNaN(Number(amount))) {
      setUsers(users.map(u => u.id === id ? { ...u, balance: u.balance + Number(amount) } : u));
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 24px 80px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Institutional Control</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage user access and capital allocations</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        <GlassCard title="🛡️ User Management" subtitle="Approve institutional access requests" icon={<Users size={20} />}>
           <div style={{ position: 'relative', marginBottom: '24px', marginTop: '16px' }}>
              <Search size={18} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" placeholder="Search users by name or email..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '12px 16px 12px 48px', color: '#f8fafc', fontSize: '14px', outline: 'none'
                }}
              />
           </div>

           <div style={{ overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
               <thead>
                 <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                   <th style={thStyle}>USER</th>
                   <th style={thStyle}>STATUS</th>
                   <th style={thStyle}>BALANCE</th>
                   <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
                 </tr>
               </thead>
               <tbody>
                 {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map((user, i) => (
                   <motion.tr 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.05 }}
                     key={user.id} 
                     style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                   >
                     <td style={tdStyle}>
                       <div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{user.name}</div>
                         <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                       </div>
                     </td>
                     <td style={tdStyle}>
                       <span style={{
                         padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
                         background: user.status === 'approved' ? 'rgba(16,185,129,0.1)' : user.status === 'pending' ? 'rgba(212,175,55,0.1)' : 'rgba(239,68,68,0.1)',
                         color: user.status === 'approved' ? '#10b981' : user.status === 'pending' ? '#d4af37' : '#ef4444',
                         textTransform: 'uppercase'
                       }}>
                         {user.status}
                       </span>
                     </td>
                     <td style={tdStyle}>
                       <div style={{ fontSize: '14px', fontWeight: 800, color: '#d4af37' }}>${user.balance.toLocaleString()}</div>
                     </td>
                     <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {user.status === 'pending' && (
                            <>
                              <button onClick={() => handleAction(user.id, 'approved')} style={actionBtnStyle} title="Approve"><CheckCircle size={18} color="#10b981" /></button>
                              <button onClick={() => handleAction(user.id, 'rejected')} style={actionBtnStyle} title="Reject"><XCircle size={18} color="#ef4444" /></button>
                            </>
                          )}
                          <button onClick={() => addFunds(user.id)} style={actionBtnStyle} title="Add Funds"><DollarSign size={18} color="#d4af37" /></button>
                          <button style={actionBtnStyle} title="Restricted"><ShieldAlert size={18} color="#475569" /></button>
                        </div>
                     </td>
                   </motion.tr>
                 ))}
               </tbody>
             </table>
           </div>
        </GlassCard>

      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '16px 12px', fontSize: '11px', color: '#475569', fontWeight: 800, letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '16px 12px' };
const actionBtnStyle: React.CSSProperties = { 
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
  padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

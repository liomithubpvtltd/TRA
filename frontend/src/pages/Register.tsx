import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      if (res.status === 'Success') {
        // Auto-login after successful registration
        login(res.user);
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px', padding: '12px 16px 12px 48px', color: '#f8fafc', fontSize: '14px',
    outline: 'none', transition: 'all 0.3s'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#020617', padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(212,175,55,0.05)', filter: 'blur(120px)', borderRadius: '50%' }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%', maxWidth: '480px', background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '40px',
          border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ marginBottom: '32px' }}>
           <Link to="/login" style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textDecoration: 'none', marginBottom: '20px' }}>
             <ArrowLeft size={16} /> Back to Login
           </Link>
           <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>Create Terminal User</h1>
           <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Join the VISION institutional network</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px', color: '#ef4444', fontSize: '13px', marginBottom: '20px', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', marginLeft: '4px' }}>FULL NAME</label>
            <div style={{ position: 'relative' }}>
               <User size={16} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 id="reg-name" name="reg-name" autoComplete="off"
                 type="text" required placeholder="John Doe"
                 value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                 style={inputStyle}
               />
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', marginLeft: '4px' }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
               <Mail size={16} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 id="reg-email" name="reg-email" autoComplete="email"
                 type="email" required placeholder="john@example.com"
                 value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                 style={inputStyle}
               />
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', marginLeft: '4px' }}>PHONE NUMBER</label>
            <div style={{ position: 'relative' }}>
               <Phone size={16} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 id="reg-phone" name="reg-phone" autoComplete="off"
                 type="tel" required placeholder="+1 (555) 000-0000"
                 value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                 style={inputStyle}
               />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', marginLeft: '4px' }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
               <Lock size={16} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 id="reg-pass" name="reg-pass" autoComplete="new-password"
                 type="password" required placeholder="••••••••"
                 value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                 style={inputStyle}
               />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', marginLeft: '4px' }}>CONFIRM</label>
            <div style={{ position: 'relative' }}>
               <Lock size={16} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 id="reg-conf-pass" name="reg-conf-pass" autoComplete="new-password"
                 type="password" required placeholder="••••••••"
                 value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                 style={inputStyle}
               />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            style={{
              gridColumn: 'span 2', background: 'linear-gradient(135deg, #d4af37 0%, #b38728 100%)',
              border: 'none', borderRadius: '14px', padding: '14px', color: '#050b14',
              fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px',
              boxShadow: '0 10px 20px -5px rgba(212,175,55,0.3)'
            }}
          >
            {loading ? 'Creating Account...' : (
              <>Register Account <UserPlus size={18} /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

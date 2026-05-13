import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await loginUser({ email, password });
      if (res.status === 'Success') {
        login(res.user);
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#020617', padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(212,175,55,0.05)', filter: 'blur(120px)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(30,58,138,0.1)', filter: 'blur(120px)', borderRadius: '50%' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '420px', background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '40px',
          border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
           <div style={{ 
             width: 56, height: 56, background: 'linear-gradient(135deg, #d4af37 0%, #9a7d26 100%)', 
             borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
             margin: '0 auto 16px', boxShadow: '0 8px 16px rgba(212,175,55,0.2)'
           }}>
             <ShieldCheck size={32} color="#050b14" />
           </div>
           <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>Welcome Back</h1>
           <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Log in to your VISION terminal</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ 
            padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px', color: '#ef4444', fontSize: '13px', marginBottom: '20px', textAlign: 'center'
          }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
               <Mail size={18} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 type="email" required placeholder="name@company.com"
                 autoComplete="off"
                 value={email} onChange={e => setEmail(e.target.value)}
                 style={{
                   width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                   borderRadius: '12px', padding: '14px 16px 14px 48px', color: '#f8fafc', fontSize: '14px',
                   outline: 'none', transition: 'all 0.3s'
                 }}
                 onFocus={e => e.currentTarget.style.borderColor = '#d4af37'}
                 onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
               />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>SECRET PASSWORD</label>
            <div style={{ position: 'relative' }}>
               <Lock size={18} color="#475569" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 type="password" required placeholder="••••••••"
                 autoComplete="current-password"
                 value={password} onChange={e => setPassword(e.target.value)}
                 style={{
                   width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                   borderRadius: '12px', padding: '14px 16px 14px 48px', color: '#f8fafc', fontSize: '14px',
                   outline: 'none', transition: 'all 0.3s'
                 }}
                 onFocus={e => e.currentTarget.style.borderColor = '#d4af37'}
                 onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
               />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #d4af37 0%, #b38728 100%)',
              border: 'none', borderRadius: '14px', padding: '14px', color: '#050b14',
              fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px',
              boxShadow: '0 10px 20px -5px rgba(212,175,55,0.3)', transition: 'all 0.3s'
            }}
          >
            {loading ? 'Authenticating...' : (
              <>Sign In to Terminal <LogIn size={18} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          New to VISION? <Link to="/register" style={{ color: '#d4af37', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
}

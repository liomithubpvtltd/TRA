import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X } from 'lucide-react';
import GlassCard from './GlassCard';
import { adjustCapital } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  balance: number;
}

export default function CapitalManagement({ balance }: Props) {
  const [showModal, setShowModal] = useState<'DEPOSIT' | 'WITHDRAW' | null>(null);
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (amt: number) => adjustCapital(amt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setShowModal(null);
      setAmount('');
    }
  });

  const handleAction = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    mutation.mutate(showModal === 'DEPOSIT' ? val : -val);
  };

  return (
    <>
      <GlassCard title="💳 Capital Management" subtitle="Manage your virtual paper funds">
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Paper Balance
          </p>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
             <span style={{ color: '#d4af37' }}>$</span>
             {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
            <button 
              onClick={() => setShowModal('DEPOSIT')}
              style={{ ...btnStyle, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <Plus size={16} /> DEPOSIT
            </button>
            <button 
              onClick={() => setShowModal('WITHDRAW')}
              style={{ ...btnStyle, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <Minus size={16} /> WITHDRAW
            </button>
          </div>
        </div>
      </GlassCard>

      <AnimatePresence>
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,11,20,0.85)', backdropFilter: 'blur(8px)'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '400px', background: '#0a1223', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {showModal === 'DEPOSIT' ? 'Deposit Capital' : 'Withdraw Funds'}
                </h3>
                <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Amount (USD)
                </label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '16px', color: '#f8fafc', fontSize: '18px', fontWeight: 700, outline: 'none'
                  }}
                />
              </div>

              <button 
                onClick={handleAction}
                disabled={mutation.isPending}
                style={{
                  width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                  background: showModal === 'DEPOSIT' ? '#10b981' : '#ef4444',
                  color: '#050b14', fontWeight: 800, fontSize: '14px', cursor: 'pointer'
                }}
              >
                {mutation.isPending ? 'PROCESSING...' : `CONFIRM ${showModal}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 0.2s ease'
};

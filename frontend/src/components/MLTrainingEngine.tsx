import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { triggerMLTraining } from '../services/api';
import GlassCard from './GlassCard';

export default function MLTrainingEngine() {
  const [status, setStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleRetrain = async () => {
    setStatus('training');
    setMessage('Initiating deep learning pipeline...');
    try {
      const res = await triggerMLTraining();
      setStatus('success');
      setMessage(res.message || 'Models updated successfully.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Training failed to initiate.');
    }
  };

  return (
    <GlassCard title="🤖 AI Model Architecture" subtitle="XGBoost & Deep Learning Engine" icon={<Cpu size={18} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Active Model</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>XGBoost Ensemble v2.4 (Live)</div>
          </div>
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '10px', fontWeight: 800 }}>
            OPTIMIZED
          </div>
        </div>

        <motion.button
          whileHover={status === 'training' ? {} : { scale: 1.02 }}
          whileTap={status === 'training' ? {} : { scale: 0.98 }}
          onClick={handleRetrain}
          disabled={status === 'training'}
          style={{
            background: status === 'training' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.15)',
            border: `1px solid rgba(212, 175, 55, ${status === 'training' ? '0.2' : '0.4'})`,
            borderRadius: '12px',
            padding: '14px',
            color: '#d4af37',
            fontSize: '12px',
            fontWeight: 800,
            cursor: status === 'training' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            letterSpacing: '0.05em'
          }}
        >
          {status === 'training' ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
                <RefreshCw size={14} />
              </motion.div>
              RECALIBRATING WEIGHTS...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle size={14} color="#10b981" />
              TRAINING INITIATED
            </>
          ) : status === 'error' ? (
             <>
              <AlertTriangle size={14} color="#ef4444" />
              RETRAIN FAILED
             </>
          ) : (
            <>
              <RefreshCw size={14} />
              INITIATE RETRAINING LOOP
            </>
          )}
        </motion.button>

        {message && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            style={{ 
              fontSize: '11px', 
              color: status === 'error' ? '#ef4444' : status === 'success' ? '#10b981' : '#64748b', 
              textAlign: 'center',
              marginTop: '4px'
            }}
          >
            {message}
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
}

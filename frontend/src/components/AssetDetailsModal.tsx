import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import PredictionEngine from './PredictionEngine';
import type { Prediction } from '../types';

interface Props {
  symbol: string;
  prediction?: Prediction;
  onClose: () => void;
}

export default function AssetDetailsModal({ symbol, prediction, onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(5, 11, 20, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '24px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: '900px', width: '100%', maxHeight: '90vh',
            overflowY: 'auto', background: 'rgba(10, 18, 35, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)', padding: '32px',
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.05)', border: 'none',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={24} color="#d4af37" />
              🧠 AI DEEP SCAN — {symbol}
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Institutional-grade probabilistic ML forecasting</p>
          </div>

          {!prediction ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Synchronizing with live market nodes...
            </div>
          ) : prediction.error ? (
            <div style={{ 
              padding: '40px', textAlign: 'center', 
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px', color: '#ef4444' 
            }}>
              <p style={{ fontWeight: 800 }}>⚠️ ANALYSIS UNAVAILABLE</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>{prediction.error}</p>
              <p style={{ fontSize: '11px', opacity: 0.6 }}>Stablecoins (USDT/USDC) typically do not exhibit technical trend patterns.</p>
            </div>
          ) : (
            <PredictionEngine prediction={prediction} />
          )}

          <button
            onClick={onClose}
            style={{
              marginTop: '32px', width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, #d4af37 0%, #b8962d 100%)',
              border: 'none', borderRadius: '12px', color: '#050b14',
              fontWeight: 900, cursor: 'pointer', letterSpacing: '0.05em'
            }}
          >
            ACKNOWLEDGE ANALYSIS
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

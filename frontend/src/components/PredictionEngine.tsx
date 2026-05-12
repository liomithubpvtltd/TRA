import { motion } from 'framer-motion';
import type { Prediction } from '../types';
import { ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

interface Props { prediction: Prediction }

function ProbabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: '20px', fontWeight: '700', color }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(to right, ${color}88, ${color})`,
            borderRadius: '99px',
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

function CircleGauge({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const isBull = value >= 50;
  const color = value > 65 ? '#10b981' : value < 35 ? '#ef4444' : '#d4af37';
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <motion.circle
            cx="70" cy="70" r={radius}
            fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '28px', fontWeight: '700', color }}>{value}%</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isBull ? 'BUY' : 'SELL'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PredictionEngine({ prediction }: Props) {
  const { buy_probability, sell_probability, trend, confidence, features_detected, volatility_score, regime, reasoning } = prediction;

  const confColor = confidence === 'High' ? 'var(--success)' : confidence === 'Medium' ? 'var(--gold-primary)' : 'var(--error)';
  const ConfIcon  = confidence === 'High' ? ShieldCheck : confidence === 'Medium' ? Zap : AlertTriangle;

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
          🧠 AI Prediction Engine
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            background: `${confColor}22`, color: confColor, fontSize: '11px', fontWeight: '700',
            padding: '4px 10px', borderRadius: '99px', border: `1px solid ${confColor}55`,
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <ConfIcon size={12} /> {confidence} Confidence
          </span>
          <span style={{
            background: 'rgba(212,175,55,0.12)', color: 'var(--gold-primary)', fontSize: '11px', fontWeight: '700',
            padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(212,175,55,0.3)',
          }}>
            {regime}
          </span>
          {prediction.model_accuracy !== undefined && prediction.model_accuracy > 0 && (
            <span style={{
              background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: '11px', fontWeight: '700',
              padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(59,130,246,0.3)',
            }}>
              Acc: {(prediction.model_accuracy * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <CircleGauge value={buy_probability} />

      <ProbabilityBar label="Buy Probability"  value={buy_probability}  color="#10b981" />
      <ProbabilityBar label="Sell Probability" value={sell_probability} color="#ef4444" />

      {/* Volatility */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '16px',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Volatility Score</span>
        <span style={{
          fontWeight: '700', fontSize: '15px',
          color: volatility_score > 65 ? '#ef4444' : volatility_score > 40 ? '#d4af37' : '#10b981',
        }}>
          {volatility_score} / 100
        </span>
      </div>

      {/* Trend badge */}
      <div style={{
        textAlign: 'center', padding: '10px',
        background: `${buy_probability > 55 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
        border: `1px solid ${buy_probability > 55 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        borderRadius: '10px', marginBottom: '16px',
        color: buy_probability > 55 ? 'var(--success)' : 'var(--error)',
        fontWeight: '700', fontSize: '15px', letterSpacing: '0.05em',
      }}>
        {trend}
      </div>

      {/* Reasoning Message */}
      {reasoning && (
        <div style={{
          padding: '12px 16px', background: 'rgba(212,175,55,0.06)', 
          border: '1px solid rgba(212,175,55,0.15)', borderRadius: '10px', marginBottom: '20px',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>
            “{reasoning}”
          </p>
        </div>
      )}

      {/* Feature tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {features_detected.map((f, i) => (
          <motion.span
            key={f}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            style={{
              fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
              background: 'rgba(212,175,55,0.1)', color: 'var(--gold-primary)',
              border: '1px solid rgba(212,175,55,0.2)', fontWeight: '500',
            }}
          >
            ✓ {f}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

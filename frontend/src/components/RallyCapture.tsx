import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ShieldAlert, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';

interface RallyCaptureProps {
  assets: any[];
  onAssetClick: (symbol: string) => void;
}

export default function RallyCapture({ assets, onAssetClick }: RallyCaptureProps) {
  // Filter only actionable signals
  const activeSignals = assets.filter(a => a.signal === 'BUY' || a.signal === 'SELL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
      <AnimatePresence>
        {activeSignals.length > 0 ? (
          activeSignals.map((asset, i) => {
            const isBuy = asset.signal === 'BUY';
            const color = isBuy ? '#10b981' : '#ef4444';
            const bgColor = isBuy ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

            return (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onAssetClick(asset.symbol)}
                style={{
                  background: 'rgba(15,23,42,0.6)',
                  border: `1px solid ${bgColor}`,
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: `0 4px 20px -5px ${bgColor}`,
                }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Glow behind */}
                <div style={{
                  position: 'absolute', top: '-50%', right: '-10%', width: '100px', height: '100px',
                  background: color, filter: 'blur(50px)', opacity: 0.2, borderRadius: '50%'
                }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: color, color: '#fff', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isBuy ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {asset.signal}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc' }}>
                      {asset.symbol}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>
                    ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </span>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Rocket size={12} color={color} /> RALLY PROBABILITY
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: color, marginTop: '2px' }}>
                      {asset.rally_prob}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldAlert size={12} color={'#d4af37'} /> SUGGESTED SL
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                      {asset.sl_percent}
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                     <span>ML CONFIDENCE: {asset.confidence.toUpperCase()}</span>
                     <Target size={12} />
                   </div>
                   <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${asset.rally_prob}%` }}
                       transition={{ duration: 1, ease: "easeOut" }}
                       style={{ height: '100%', background: color }}
                     />
                   </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Rocket size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            No immediate rally targets detected by ML Engine. Waiting for volume confirmation.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

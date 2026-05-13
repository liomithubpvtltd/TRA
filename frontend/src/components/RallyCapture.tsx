import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ShieldAlert, ArrowUpRight, ArrowDownRight, BellRing, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { executeTrade } from '../services/api';

interface RallyCaptureProps {
  assets: any[];
  onAssetClick: (symbol: string) => void;
}

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio block:", e);
  }
};

const playExecuteSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) return;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); 
      oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.1); 
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
};

export default function RallyCapture({ assets, onAssetClick }: RallyCaptureProps) {
  const { user, refreshUser } = useAuth();
  const [toast, setToast] = useState<{title: string, msg: string, type: 'BUY' | 'SELL' | 'SUCCESS' | 'ERROR'} | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const knownSignals = useRef<Set<string>>(new Set());

  // Filter only actionable signals
  const activeSignals = assets.filter(a => a.signal === 'BUY' || a.signal === 'SELL');

  useEffect(() => {
    let triggered = false;
    let latestSignal = null;

    activeSignals.forEach(asset => {
      const sigKey = `${asset.symbol}-${asset.signal}`;
      if (!knownSignals.current.has(sigKey)) {
        knownSignals.current.add(sigKey);
        triggered = true;
        latestSignal = asset;
      }
    });

    if (triggered && latestSignal) {
      playNotificationSound();
      setToast({
        title: `NEW ${latestSignal.signal} ALERT`,
        msg: `${latestSignal.symbol} breakout detected!`,
        type: latestSignal.signal as any
      });
      setTimeout(() => setToast(null), 5000);
    }
  }, [activeSignals]);

  const handleExecute = async (e: React.MouseEvent, asset: any) => {
    e.stopPropagation();
    if (!user || executing) return;
    
    setExecuting(asset.symbol);
    try {
        const res = await executeTrade({
            email: user.email,
            symbol: asset.symbol,
            side: asset.signal,
            price: asset.price,
            size: 1.0 // Default size for one-click
        });

        if (res.status === 'Success') {
            playExecuteSound();
            setToast({
                title: 'TRADE EXECUTED',
                msg: `Direct entry: ${asset.symbol} @ ${asset.price}`,
                type: 'SUCCESS'
            });
            refreshUser();
        } else {
            setToast({
                title: 'EXECUTION FAILED',
                msg: res.message || 'Verification error',
                type: 'ERROR'
            });
        }
    } catch (err) {
        setToast({
            title: 'NETWORK ERROR',
            msg: 'Matrix bridge interrupted',
            type: 'ERROR'
        });
    } finally {
        setExecuting(null);
        setTimeout(() => setToast(null), 8000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px', position: 'relative' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: '80px',
              right: '24px',
              zIndex: 9999,
              background: 'rgba(5, 11, 20, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${toast.type === 'BUY' || toast.type === 'SUCCESS' ? '#10b981' : '#ef4444'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
            }}
          >
            <div style={{ padding: '8px', background: toast.type === 'BUY' || toast.type === 'SUCCESS' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
               <BellRing color={toast.type === 'BUY' || toast.type === 'SUCCESS' ? '#10b981' : '#ef4444'} size={20} />
            </div>
            <div style={{ minWidth: '180px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: toast.type === 'BUY' || toast.type === 'SUCCESS' ? '#10b981' : '#ef4444', letterSpacing: '0.05em' }}>{toast.title}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>{toast.msg}</div>
            </div>
            <X size={16} color="#64748b" style={{ cursor: 'pointer', marginLeft: '12px' }} onClick={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSignals.length > 0 ? (
          activeSignals.map((asset, i) => {
            const isBuy = asset.signal === 'BUY';
            const color = isBuy ? '#10b981' : '#ef4444';
            const bgColor = isBuy ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
            const isOp = executing === asset.symbol;

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
                    {asset.strategy && (
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                        {asset.strategy}
                      </span>
                    )}
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
                      {asset.probability || asset.winRate}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
                      RISK REWARD
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', marginTop: '2px' }}>
                      {asset.rr || "1:3.2"}
                    </div>
                  </div>
                </div>

                {/* Footer / Execution */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3].map(t => (
                        <div key={t} style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                          TP{t}
                        </div>
                      ))}
                   </div>

                   <motion.button
                     whileHover={{ scale: 1.05, background: color, color: '#fff' }}
                     whileTap={{ scale: 0.95 }}
                     disabled={isOp}
                     onClick={(e) => handleExecute(e, asset)}
                     style={{
                       background: isOp ? 'rgba(100,116,139,0.2)' : `${color}15`,
                       border: `1px solid ${color}`,
                       borderRadius: '8px',
                       padding: '8px 16px',
                       color: isOp ? '#64748b' : color,
                       fontSize: '11px',
                       fontWeight: 900,
                       cursor: isOp ? 'wait' : 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '6px',
                       transition: 'all 0.3s'
                     }}
                   >
                     {isOp ? 'EXECUTING...' : 'ONE-CLICK EXECUTION'}
                     {!isOp && <Zap size={12} fill={color} />}
                   </motion.button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
             <ShieldAlert size={32} color="#1e293b" style={{ margin: '0 auto 12px' }} />
             <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Awaiting Matrix Breakout</div>
             <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Real-time signal engine is active</div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

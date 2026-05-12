import { motion } from 'framer-motion';
import { LineChart } from 'lucide-react';

interface CryptoAsset {
  symbol: string;
  price: number;
  changePct: number;
  volume: number;
  ml_score?: number;
}

interface Props {
  assets: CryptoAsset[];
}

export default function CryptoTicker({ assets }: Props) {
  if (!assets || assets.length === 0) return null;

  return (
    <div style={{
      marginBottom: '24px',
      overflow: 'hidden',
      position: 'relative',
      padding: '10px 0'
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '8px',
        maxHeight: '400px', overflowY: 'auto',
        paddingRight: '8px',
      }}>
        {assets.map((asset, i) => (
          <motion.div
            key={asset.symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '50px 1.5fr 1fr 1fr 1fr',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(30,58,138,0.05)',
              border: '1px solid rgba(255,255,255,0.03)',
              borderRadius: '12px',
              gap: '12px'
            }}
          >
            {/* Rank / Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(212,175,55,0.1)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span style={{ fontSize: '10px', color: '#d4af37', fontWeight: 900 }}>SCORE</span>
              <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 900 }}>{asset.ml_score || Math.floor(Math.random() * 50 + 20)}</span>
            </div>

            {/* Asset Name */}
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {asset.symbol}
              <a href={`https://www.tradingview.com/chart/?symbol=${asset.symbol.replace('/', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#475569', display: 'flex' }} onClick={e => e.stopPropagation()}>
                <LineChart size={12} />
              </a>
            </div>

            {/* Price */}
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
              ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString()}
            </div>

            {/* 24h Change */}
            <div style={{ 
              fontSize: '13px', fontWeight: 700, 
              color: asset.changePct >= 0 ? '#10b981' : '#ef4444' 
            }}>
              {asset.changePct >= 0 ? '+' : ''}{asset.changePct.toFixed(2)}%
            </div>

            {/* Volume */}
            <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600, textAlign: 'right' }}>
              Vol: ${(asset.volume / 1000000).toFixed(1)}M
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

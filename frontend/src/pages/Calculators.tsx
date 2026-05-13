import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '../components/GlassCard';
import { 
  Clock, ArrowRightLeft, Target, Globe, 
  TrendingUp, Info
} from 'lucide-react';
import { fetchLiveRates } from '../services/api';

export default function Calculators() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: isMobile ? '80px 24px 120px' : '40px 24px 80px' }}>
      
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
          Terminal <span style={{ color: '#d4af37' }}>Utility Suite</span>
        </h1>
        <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: '15px' }}>
          Real-time risk metrics and global timing synchronization
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
        <PipCalculator />
        <CurrencyConverter />
        <WorldClock />
        <MarketSessions />
      </div>
    </div>
  );
}

function PipCalculator() {
  const [assetType, setAssetType] = useState('FX');
  const [lotSize, setLotSize] = useState(1);
  const [pips, setPips] = useState(10);
  
  // Basic Logic: FX Std Lot = $10/pip, GOLD Std Lot = $10/pip (per 0.10 move)
  const multiplier = assetType === 'GOLD' ? 10 : 10; 
  const result = (lotSize * multiplier * pips).toFixed(2);

  return (
    <GlassCard title="🧮 Institutional Pip Engine" icon={<Target size={20} color="#d4af37" />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setAssetType('FX')}
            style={{ ...tabStyle, borderBottom: assetType === 'FX' ? '2px solid #d4af37' : 'none', color: assetType === 'FX' ? '#f8fafc' : '#475569' }}
          >FOREX MAJORS</button>
          <button 
            onClick={() => setAssetType('GOLD')}
            style={{ ...tabStyle, borderBottom: assetType === 'GOLD' ? '2px solid #d4af37' : 'none', color: assetType === 'GOLD' ? '#f8fafc' : '#475569' }}
          >XAU/USD (GOLD)</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>POSITION SIZE (LOTS)</label>
            <input 
              type="number" step="0.01" value={lotSize} onChange={e => setLotSize(+e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>PROFIT/LOSS (PIPS)</label>
            <input 
              type="number" value={pips} onChange={e => setPips(+e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={resultBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>ESTIMATED EQUITY IMPACT</div>
            <TrendingUp size={14} color="#10b981" />
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: '#f8fafc', marginTop: '8px' }}>
            ${Number(result).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: '#475569', marginTop: '8px', fontStyle: 'italic' }}>
            *Calculated using standard lot pricing ($10 per pip/point base)
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function CurrencyConverter() {
  const [usdAmount, setUsdAmount] = useState(1);
  const { data: liveRates } = useQuery({
    queryKey: ['live-rates'],
    queryFn: fetchLiveRates,
    refetchInterval: 60000,
    initialData: { INR: 95.67, EUR: 0.92, GBP: 0.79, JPY: 156.40, AED: 3.67, XAU: 0.00042 }
  });

  const rates = liveRates || { INR: 95.67, EUR: 0.92, GBP: 0.79, JPY: 156.40, AED: 3.67, XAU: 0.00042 };

  return (
    <GlassCard title="💱 Global Liquidity Converter" icon={<ArrowRightLeft size={20} color="#d4af37" />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
        <div>
          <label style={labelStyle}>BASE CAPITAL (USD)</label>
          <input 
            type="number" value={usdAmount} onChange={e => setUsdAmount(+e.target.value)}
            style={{ ...inputStyle, fontSize: '18px', padding: '16px', fontWeight: 800, color: '#d4af37' }}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {Object.entries(rates).map(([curr, rate]) => (
            <div key={curr} style={currencyItemStyle}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>{curr}</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', marginTop: '4px' }}>
                {(usdAmount * (rate as number)).toLocaleString(undefined, { maximumFractionDigits: (curr === 'XAU' ? 5 : 2) })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Info size={14} color="#64748b" />
          <div style={{ fontSize: '11px', color: '#64748b' }}>Real-time indicative rates synced via Terminal Bridge.</div>
        </div>
      </div>
    </GlassCard>
  );
}

function WorldClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (tz: string) => new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(time);

  const zones = [
    { name: 'London', tz: 'Europe/London', flag: '🇬🇧' },
    { name: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
    { name: 'Mumbai (IST)', tz: 'Asia/Kolkata', flag: '🇮🇳' },
    { name: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
    { name: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
    { name: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
  ];

  return (
    <GlassCard title="🌐 Synchronization Matrix" icon={<Globe size={20} color="#d4af37" />}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        {zones.map(z => (
          <div key={z.name} style={clockItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{z.flag}</span>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>{z.name.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', marginTop: '6px', fontFamily: 'monospace', letterSpacing: '1px' }}>
              {format(z.tz)}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function MarketSessions() {
  return (
    <GlassCard title="⏳ Execution Windows" icon={<Clock size={20} color="#d4af37" />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {[
          { name: 'SYDNEY', hours: '22:00 - 07:00', status: 'CLOSED', color: '#64748b' },
          { name: 'TOKYO', hours: '00:00 - 09:00', status: 'OPEN', color: '#10b981' },
          { name: 'LONDON', hours: '08:00 - 17:00', status: 'CLOSED', color: '#64748b' },
          { name: 'NEW YORK', hours: '13:00 - 22:00', status: 'CLOSED', color: '#64748b' },
        ].map(s => (
          <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc' }}>{s.name}</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{s.hours} GMT</div>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 900, color: s.color, padding: '4px 8px', background: `${s.color}10`, borderRadius: '6px', border: `1px solid ${s.color}20` }}>
              {s.status}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '8px', letterSpacing: '0.05em' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', color: '#f8fafc', fontSize: '15px', fontWeight: 700, outline: 'none' };
const resultBoxStyle: React.CSSProperties = { background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(0,0,0,0))', padding: '24px', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.1)', marginTop: '8px' };
const tabStyle: React.CSSProperties = { background: 'none', border: 'none', padding: '8px 4px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.1em' };
const currencyItemStyle: React.CSSProperties = { padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' };
const clockItemStyle: React.CSSProperties = { padding: '16px', background: 'rgba(212,175,55,0.03)', borderRadius: '14px', border: '1px solid rgba(212,175,55,0.1)' };

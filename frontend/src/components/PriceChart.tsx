import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { fetchOHLCV } from '../services/api';
import type { CandleData } from '../types';

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [interval, setTimeInterval] = useState('1h');
  const [tfLabel, setTfLabel] = useState('1H');

  useEffect(() => {
    async function loadData() {
      const data = await fetchOHLCV('GC=F', interval);
      if (data && data.length > 0) {
        setCandles(data);
      }
    }
    loadData();
    const refreshTimer = setInterval(loadData, 30000); 
    return () => clearInterval(refreshTimer);
  }, [interval]);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;
    
    // ... (rest of the logic stays the same)

    try {
      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
          fontFamily: 'Outfit, sans-serif',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dashed },
          horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dashed },
        },
        crosshair: {
          vertLine: { color: '#d4af37', width: 1, style: LineStyle.Dashed },
          horzLine: { color: '#d4af37', width: 1, style: LineStyle.Dashed },
        },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
        timeScale: {
          borderColor: 'rgba(255,255,255,0.08)',
          timeVisible: true,
          secondsVisible: false,
        },
        width:  containerRef.current.clientWidth,
        height: 320,
        localization: {
          locale: navigator.language,
          dateFormat: 'yyyy-MM-dd',
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor:         '#10b981',
        downColor:       '#ef4444',
        borderUpColor:   '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor:     '#10b981',
        wickDownColor:   '#ef4444',
      });

      // Convert time strings to Unix timestamps (seconds)
      const formattedCandles = candles.map(c => ({
        ...c,
        time: Math.floor(new Date(c.time).getTime() / 1000)
      }));

      candleSeries.setData(formattedCandles as any);

      // Correct EMA Calculation Helper
      const calculateEMA = (data: any[], period: number) => {
        const k = 2 / (period + 1);
        let ema = data[0].close;
        return data.map(c => {
          ema = c.close * k + ema * (1 - k);
          return { time: c.time, value: +ema.toFixed(2) };
        });
      };

      // EMA 20 line
      const ema20 = chart.addSeries(LineSeries, {
        color: '#d4af37',
        lineWidth: 2,
        title: 'EMA 20',
      });
      ema20.setData(calculateEMA(formattedCandles, 20) as any);

      // EMA 50 line
      const ema50 = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'EMA 50',
      });
      ema50.setData(calculateEMA(formattedCandles, 50) as any);

      // EMA 200 line
      const ema200 = chart.addSeries(LineSeries, {
        color: '#6366f1',
        lineWidth: 2,
        title: 'EMA 200',
      });
      ema200.setData(calculateEMA(formattedCandles, 200) as any);

      // Volume Series (Bottom overlay)
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      const volumeData = formattedCandles.map(c => ({
        time: c.time,
        value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
      }));
      volumeSeries.setData(volumeData as any);

      // Support & Resistance Analysis
      const addSRLevel = (price: number, label: string, color: string) => {
        candleSeries.createPriceLine({
          price: price,
          color: color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: label,
        });
      };

      if (formattedCandles.length >= 50) {
        const windows = [50, 100, 200];
        windows.forEach(w => {
            const dataSlice = formattedCandles.slice(-Math.min(w, formattedCandles.length));
            const high = Math.max(...dataSlice.map(c => c.high));
            const low  = Math.min(...dataSlice.map(c => c.low));
            
            // Only show distinct levels
            addSRLevel(high, `R ${w}`, '#ef4444');
            addSRLevel(low,  `S ${w}`, '#10b981');
        });
      }

      // Center the last candle by setting a significant right offset
      chart.timeScale().applyOptions({
        rightOffset: 50, // Keep significant space on the right to center current data
      });
      
      // We don't use fitContent here as it pushes data to the right edge
      // Instead we scroll to the end with an offset
      chart.timeScale().scrollToPosition(0, false); 

      const handleResize = () => {
        if (containerRef.current && chart) chart.applyOptions({ width: containerRef.current.clientWidth });
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      console.error("PriceChart Error:", err);
    }
  }, [candles]);

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
            📈 XAU/USD — {tfLabel} Chart
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Live market data · EMA 20/50/200</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { label: '15m', val: '15m' },
            { label: '1H',  val: '1h' },
            { label: '4H',  val: '4h' },
            { label: '1D',  val: '1d' }
          ].map(({ label, val }) => (
            <button key={label} 
              onClick={() => { setTimeInterval(val); setTfLabel(label); }}
              style={{
                background: tfLabel === label ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                border:     tfLabel === label ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color:      tfLabel === label ? 'var(--gold-primary)' : 'var(--text-secondary)',
                borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.2s',
              }}>{label}</button>
          ))}
        </div>
      </div>
      <div ref={containerRef} />
    </div>
  );
}

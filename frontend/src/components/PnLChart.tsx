import { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';

interface PnLChartProps {
  data: { time: string; value: number }[];
}

export default function PnLChart({ data }: PnLChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.02)' },
        horzLines: { color: 'rgba(255,255,255,0.02)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    const lineSeries = chart.addSeries(AreaSeries, {
      lineColor: '#d4af37',
      topColor: 'rgba(212, 175, 55, 0.2)',
      bottomColor: 'rgba(212, 175, 55, 0.0)',
      lineWidth: 2,
    });

    const sortedData = [...data]
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .map(d => ({
        time: Math.floor(new Date(d.time).getTime() / 1000) as any,
        value: d.value,
      }));

    lineSeries.setData(sortedData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: '100%' }} />;
}

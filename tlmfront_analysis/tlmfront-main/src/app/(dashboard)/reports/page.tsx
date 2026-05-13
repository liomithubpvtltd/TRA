'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tlmApis } from '@/api/tlmapis';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle, 
  Clock, 
  User, 
  Activity, 
  BarChart3, 
  Briefcase,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface ReportItem {
  id: number;
  symbol: string;
  exchange?: string;
  action: string;
  entry_price: number;
  closed_price: number | null;
  status: string;
  pnl_pct: number;
  strategy: string;
  closed_at: string | null;
  entry_time: string | null;
  exit_time: string | null;
  target_hit_time: string | null;
  target_value: number | null;
  target_name: string | null;
  market_closing_price: number | null;
  max_high: number | null;
  max_high_time: string | null;
  created_at: string | null;
}

type ReportsData = Record<string, ReportItem[]>;

// Personal Report Interfaces
interface TradeActivity {
  symbol: string;
  type: string;
  quantity: number;
  price: number;
  pnl_amount: number | null;
  pnl_percentage: number | null;
  time: string;
}

interface DailyActivity {
  buy_qty: number;
  sell_qty: number;
  trades: TradeActivity[];
}

interface HoldingReport {
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  ltp: number;
  investment: number;
  current_value: number;
  pnl: number;
  pnl_pct: number;
}

interface PersonalReportData {
  daily_activity: Record<string, DailyActivity>;
  holdings: HoldingReport[];
  summary: {
    total_investment: number;
    total_pnl: number;
    current_balance: number;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'personal'>('general');
  const [reports, setReports] = useState<ReportsData>({});
  const [personalData, setPersonalData] = useState<PersonalReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [expandedPersonalDates, setExpandedPersonalDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'general') {
        const res = await tlmApis.getRecommendationReports();
        setReports(res.data);
        const dates = Object.keys(res.data);
        if (dates.length > 0) {
          setExpandedDates({ [dates[0]]: true });
        }
      } else {
        const res = await tlmApis.getPersonalReport();
        setPersonalData(res.data);
        const dates = Object.keys(res.data.daily_activity);
        if (dates.length > 0) {
          setExpandedPersonalDates({ [dates[0]]: true });
        }
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const togglePersonalDate = (date: string) => {
    setExpandedPersonalDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleStockClick = (symbol: string, dateStr: string) => {
    // Open in new tab with both symbol and date as query parameters
    window.open(`/home?symbol=${symbol}&date=${dateStr}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TARGET HIT': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SL HIT': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'PROFIT BOOKING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'HOLDED': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'ACTIVE': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const sortedDates = Object.keys(reports).sort((a, b) => b.localeCompare(a));
  const sortedPersonalDates = personalData ? Object.keys(personalData.daily_activity).sort((a, b) => b.localeCompare(a)) : [];

  const sortGeneralItems = (items: ReportItem[]) => {
    return [...items].sort((a, b) => {
      const getPriority = (status: string) => {
        const s = status.toUpperCase();
        if (s.includes('TARGET') || s.includes('PROFIT')) return 0;
        if (s.includes('HOLD') || s.includes('ACTIVE')) return 1;
        return 2;
      };
      const prioA = getPriority(a.status);
      const prioB = getPriority(b.status);
      if (prioA !== prioB) return prioA - prioB;
      return b.pnl_pct - a.pnl_pct;
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-white bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Performance Reports
          </h1>
          <p className="text-zinc-500 font-medium text-sm">
            {activeTab === 'general' 
              ? 'Historical track record of all algorithmic signals.' 
              : 'Detailed analysis of your personal trading performance.'}
          </p>
        </div>

        <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/50 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              activeTab === 'general' 
                ? 'bg-zinc-800 text-white shadow-xl shadow-black/20' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            General Report
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              activeTab === 'personal' 
                ? 'bg-zinc-800 text-white shadow-xl shadow-black/20' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User className="w-4 h-4" />
            Personal Report
          </button>
        </div>
      </div>

      {activeTab === 'general' ? (
        /* General Report Section */
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="text-center py-20 border border-zinc-800/50 border-dashed bg-zinc-900/10 rounded-2xl text-zinc-500 font-medium">
              No general report data available yet.
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl transition-all duration-300 hover:border-zinc-700/60 relative">
                <button 
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/40 transition-colors sticky top-0 bg-zinc-900/95 backdrop-blur-md z-20 border-b border-zinc-800/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-zinc-100">
                        {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium">{reports[date].length} Signals Generated</p>
                    </div>
                  </div>
                  {expandedDates[date] ? <ChevronDown className="text-zinc-500" /> : <ChevronRight className="text-zinc-500" />}
                </button>

                {expandedDates[date] && (
                  <div className="border-t border-zinc-800/60 p-4 md:p-6">
                    {/* Desktop Table */}
                    <table className="w-full text-left border-collapse hidden md:table">
                      <thead>
                        <tr className="sticky top-[88px] z-10 bg-zinc-900/95 backdrop-blur-sm text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800/50 shadow-sm">
                          <th className="pb-4 pt-4">Stock</th>
                          <th className="pb-4 pt-4">Action</th>
                          <th className="pb-4 pt-4">Entry</th>
                          <th className="pb-4 pt-4">Target</th>
                          <th className="pb-4 pt-4">Exit</th>
                          <th className="pb-4 pt-4">Status</th>
                          <th className="pb-4 pt-4">Day High</th>
                          <th className="pb-4 pt-4">Day Close</th>
                          <th className="pb-4 pt-4 text-right">P&L %</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-medium">
                        {sortGeneralItems(reports[date]).map((item) => (
                          <tr key={item.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                            <td 
                              className="py-4 cursor-pointer group/stock" 
                              onClick={() => handleStockClick(item.symbol, date)}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-100 font-bold group-hover/stock:text-teal-400 transition-colors">{item.symbol}</span>
                                  <a 
                                    href={`https://in.tradingview.com/chart/?symbol=${item.exchange || 'NSE'}:${item.symbol}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 px-1.5 rounded bg-zinc-800/50 hover:bg-zinc-700 text-[8px] font-black text-teal-400 border border-zinc-700/50 transition-colors"
                                    title="View TradingView Chart"
                                  >
                                    ↗
                                  </a>
                                </div>
                                <span className="text-[10px] text-zinc-500 uppercase">{item.strategy}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${item.action === 'BUY' ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {item.action}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="text-zinc-300">₹{item.entry_price.toLocaleString()}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                  <span>{formatDate(item.entry_time || item.created_at)}</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                  <span>{formatTime(item.entry_time || item.created_at)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-zinc-300">
                               {item.target_value ? (
                                 <div className="flex flex-col">
                                   <div className="flex items-center gap-1.5">
                                     <span className={`${item.status === 'TARGET HIT' ? 'text-emerald-400 font-bold' : 'text-zinc-300 font-medium'}`}>
                                       ₹{item.target_value.toLocaleString()}
                                     </span>
                                     {item.status === 'TARGET HIT' && item.target_name && (
                                       <span className="px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black border border-emerald-500/20">
                                         {item.target_name}
                                       </span>
                                     )}
                                   </div>
                                   {item.target_hit_time && (
                                     <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                       <span>{formatDate(item.target_hit_time)}</span>
                                       <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                       <span>{formatTime(item.target_hit_time)}</span>
                                     </div>
                                   )}
                                 </div>
                               ) : '—'}
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="text-zinc-300">{item.closed_price ? `₹${item.closed_price.toLocaleString()}` : '—'}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                  <span>{formatDate(item.exit_time || item.closed_at)}</span>
                                  {(item.exit_time || item.closed_at) && <span className="w-1 h-1 rounded-full bg-zinc-700"></span>}
                                  <span>{formatTime(item.exit_time || item.closed_at)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wide ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 text-zinc-300 font-medium">
                              {item.max_high ? (
                                <div className="flex flex-col">
                                  <span>₹{item.max_high.toLocaleString()}</span>
                                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                    <span>{formatDate(item.max_high_time)}</span>
                                    {item.max_high_time && <span className="w-1 h-1 rounded-full bg-zinc-700"></span>}
                                    <span>{formatTime(item.max_high_time)}</span>
                                  </div>
                                </div>
                              ) : '—'}
                            </td>
                            <td className="py-4 text-zinc-300">
                              {item.market_closing_price ? `₹${item.market_closing_price.toLocaleString()}` : '—'}
                            </td>
                            <td className={`py-4 text-right font-black ${item.pnl_pct >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                              {item.pnl_pct >= 0 ? '+' : ''}{item.pnl_pct}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {sortGeneralItems(reports[date]).map((item) => (
                        <div key={item.id} className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex flex-col cursor-pointer" 
                              onClick={() => handleStockClick(item.symbol, date)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-100 font-bold">{item.symbol}</span>
                                <a 
                                  href={`https://in.tradingview.com/chart/?symbol=${item.exchange || 'NSE'}:${item.symbol}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 px-1.5 rounded bg-zinc-800 text-[8px] font-black text-teal-400 border border-zinc-700"
                                >
                                  ↗
                                </a>
                              </div>
                              <span className="text-[10px] text-zinc-500 uppercase">{item.strategy}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-lg border text-[10px] font-bold tracking-wide ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex flex-col gap-1">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">Entry</span>
                              <span className="text-zinc-200">₹{item.entry_price.toLocaleString()}</span>
                              <span className="text-[9px] text-zinc-600">{formatDate(item.entry_time || item.created_at)} {formatTime(item.entry_time || item.created_at)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">Exit</span>
                              <span className="text-zinc-200">{item.closed_price ? `₹${item.closed_price.toLocaleString()}` : '—'}</span>
                              <span className="text-[9px] text-zinc-600">{formatDate(item.exit_time || item.closed_at)} {formatTime(item.exit_time || item.closed_at)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">Target</span>
                              <span className="text-emerald-400">₹{item.target_value?.toLocaleString() || '—'}</span>
                              {item.target_hit_time && <span className="text-[9px] text-zinc-600">{formatTime(item.target_hit_time)}</span>}
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">Day High</span>
                              <span className="text-zinc-200">₹{item.max_high?.toLocaleString() || '—'}</span>
                              {item.max_high_time && <span className="text-[9px] text-zinc-600">{formatTime(item.max_high_time)}</span>}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-zinc-700/50 flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">P&L %</span>
                              <span className={`font-black text-sm ${item.pnl_pct >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                                {item.pnl_pct >= 0 ? '+' : ''}{item.pnl_pct}%
                              </span>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-black ${item.action === 'BUY' ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {item.action}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Personal Report Section */
        <div className="space-y-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Briefcase className="w-12 h-12 text-white" />
              </div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total Investment</p>
              <h3 className="text-2xl font-black text-white">₹{personalData?.summary.total_investment.toLocaleString()}</h3>
            </div>

            <div className={`bg-zinc-900/40 border p-6 rounded-2xl relative overflow-hidden group transition-colors ${
              (personalData?.summary.total_pnl || 0) >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'
            }`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-12 h-12 text-white" />
              </div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total P&L</p>
              <div className="flex items-center gap-2">
                <h3 className={`text-2xl font-black ${(personalData?.summary.total_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(personalData?.summary.total_pnl || 0) >= 0 ? '+' : ''}₹{personalData?.summary.total_pnl.toLocaleString()}
                </h3>
                {(personalData?.summary.total_pnl || 0) >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet className="w-12 h-12 text-white" />
              </div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Available Funds</p>
              <h3 className="text-2xl font-black text-white">₹{personalData?.summary.current_balance.toLocaleString()}</h3>
            </div>
          </div>

          {/* Holdings Section */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800/60 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white">Current Holdings</h2>
            </div>
            <div className="p-4 md:p-6 overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800/50">
                    <th className="pb-4">Stock</th>
                    <th className="pb-4">Qty</th>
                    <th className="pb-4">Avg Price</th>
                    <th className="pb-4">LTP</th>
                    <th className="pb-4">Investment</th>
                    <th className="pb-4 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {personalData?.holdings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-zinc-500">No active holdings found.</td>
                    </tr>
                  ) : (
                    personalData?.holdings.map((h) => (
                      <tr key={h.symbol} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-zinc-100 font-bold">{h.symbol}</span>
                            <span className="text-[10px] text-zinc-500 uppercase">{h.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-zinc-300 font-bold">{h.quantity}</td>
                        <td className="py-4 text-zinc-400">₹{h.avg_price.toLocaleString()}</td>
                        <td className="py-4 text-zinc-100 font-bold">₹{h.ltp.toLocaleString()}</td>
                        <td className="py-4 text-zinc-400">₹{h.investment.toLocaleString()}</td>
                        <td className="py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-black ${h.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString()}
                            </span>
                            <span className={`text-[10px] font-bold ${h.pnl_pct >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                              {h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {personalData?.holdings.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500">No active holdings found.</div>
                ) : (
                  personalData?.holdings.map((h) => (
                    <div key={h.symbol} className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-zinc-100 font-bold">{h.symbol}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">{h.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-sm ${h.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString()}
                          </span>
                          <span className={`text-[10px] font-bold ${h.pnl_pct >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                            {h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-700/50 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 font-bold uppercase text-[9px]">Quantity</span>
                          <span className="text-zinc-200 font-bold">{h.quantity}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 font-bold uppercase text-[9px]">Avg Price</span>
                          <span className="text-zinc-200">₹{h.avg_price.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 font-bold uppercase text-[9px]">LTP</span>
                          <span className="text-teal-400 font-bold">₹{h.ltp.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 font-bold uppercase text-[9px]">Investment</span>
                          <span className="text-zinc-200">₹{h.investment.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Daily Activity Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white">Daily Trade Activity</h2>
            </div>
            
            {sortedPersonalDates.length === 0 ? (
              <div className="text-center py-20 border border-zinc-800/50 border-dashed bg-zinc-900/10 rounded-2xl text-zinc-500 font-medium">
                No trading activity recorded yet.
              </div>
            ) : (
              sortedPersonalDates.map((date) => (
                <div key={date} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
                  <button 
                    onClick={() => togglePersonalDate(date)}
                    className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-zinc-100">
                          {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 text-teal-500" />
                            {personalData?.daily_activity[date].buy_qty} Bought
                          </span>
                          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3 text-rose-500" />
                            {personalData?.daily_activity[date].sell_qty} Sold
                          </span>
                        </div>
                      </div>
                    </div>
                    {expandedPersonalDates[date] ? <ChevronDown className="text-zinc-500" /> : <ChevronRight className="text-zinc-500" />}
                  </button>

                  {expandedPersonalDates[date] && (
                    <div className="border-t border-zinc-800/60 p-4 md:p-6">
                      {/* Desktop Table */}
                      <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                          <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800/50">
                            <th className="pb-4">Stock</th>
                            <th className="pb-4">Type</th>
                            <th className="pb-4">Quantity</th>
                            <th className="pb-4">Price</th>
                            <th className="pb-4">P&L</th>
                            <th className="pb-4 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                          {personalData?.daily_activity[date].trades.map((trade, idx) => {
                            const isSell = trade.type === 'SELL';
                            const pnl = trade.pnl_amount;
                            const pnlPct = trade.pnl_percentage;
                            return (
                              <tr key={`${date}-${idx}`} className="border-b border-zinc-800/30">
                                <td className="py-4 text-zinc-100 font-bold">{trade.symbol}</td>
                                <td className="py-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${trade.type === 'BUY' ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {trade.type}
                                  </span>
                                </td>
                                <td className="py-4 text-zinc-300">{trade.quantity}</td>
                                <td className="py-4 text-zinc-300">₹{trade.price.toLocaleString()}</td>
                                <td className="py-4">
                                  {isSell && pnl !== null && pnlPct !== null ? (
                                    <div className="flex flex-col">
                                      <span className={`text-xs font-bold ${pnl >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                                        {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString()}
                                      </span>
                                      <span className={`text-[10px] font-medium opacity-80 ${pnl >= 0 ? 'text-teal-500' : 'text-rose-500'}`}>
                                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-600">—</span>
                                  )}
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-zinc-500 font-mono text-[10px]">
                                      {new Date(trade.time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <span className="text-zinc-400 font-mono text-xs">
                                      {new Date(trade.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {personalData?.daily_activity[date].trades.map((trade, idx) => (
                          <div key={`${date}-${idx}`} className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-100 font-bold">{trade.symbol}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${trade.type === 'BUY' ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {trade.type}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className="flex flex-col gap-1">
                                <span className="text-zinc-500 font-bold uppercase text-[9px]">Qty</span>
                                <span className="text-zinc-200">{trade.quantity}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-zinc-500 font-bold uppercase text-[9px]">Price</span>
                                <span className="text-zinc-200">₹{trade.price.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-zinc-500 font-bold uppercase text-[9px]">P&L</span>
                                <span className={`text-[10px] font-bold ${trade.type === 'SELL' && trade.pnl_amount !== null && trade.pnl_percentage !== null ? (trade.pnl_amount >= 0 ? 'text-teal-400' : 'text-rose-400') : 'text-zinc-500'}`}>
                                  {trade.type === 'SELL' && trade.pnl_amount !== null && trade.pnl_percentage !== null ? `${trade.pnl_amount >= 0 ? '+' : ''}${trade.pnl_percentage.toFixed(1)}%` : '—'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 text-right">
                                <span className="text-zinc-500 font-bold uppercase text-[9px]">Time</span>
                                <span className="text-zinc-500 font-mono text-[10px]">
                                  {new Date(trade.time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(trade.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState, useMemo } from 'react';
import { Debt, DebtType } from '../types';
import { DEBT_ICONS } from './IconPicker';
import { calculateAccumulatedFees } from '../utils/feeCalculator';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { hapticFeedback } from '../utils/haptics';

interface DebtHistoryModalProps {
  debt: Debt;
  allDebts?: Debt[]; // Pass all debts to calculate person-specific analytics
  onClose: () => void;
  onUpdateManualFee?: (id: string, fee: number) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

const DebtHistoryModal: React.FC<DebtHistoryModalProps> = ({ debt, allDebts = [], onClose, onUpdateManualFee }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'analytics'>('details');
  const [manualFeeInput, setManualFeeInput] = useState(debt.feeConfig?.manualAdjustment?.toString() || '0');
  const [isEditingFees, setIsEditingFees] = useState(false);

  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  // Person-specific analytics data
  const contactAnalytics = useMemo(() => {
    const personDebts = allDebts.filter(d => d.name === debt.name);
    
    // 1. Balance Trend
    const sorted = [...personDebts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = 0;
    const trendData = sorted.map(d => {
      const change = d.type === DebtType.OWED_TO_ME ? d.originalAmount : -d.originalAmount;
      runningBalance += change;
      return {
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: runningBalance
      };
    });

    // 2. Category Split
    const cats: Record<string, number> = {};
    personDebts.forEach(d => {
      cats[d.icon] = (cats[d.icon] || 0) + d.originalAmount;
    });
    const categoryData = Object.entries(cats).map(([name, value]) => ({ name, value }));

    return { trendData, categoryData, totalInteractions: personDebts.length };
  }, [allDebts, debt.name]);

  const isOwedToMe = debt.type === DebtType.OWED_TO_ME;
  const autoFees = calculateAccumulatedFees({ ...debt, feeConfig: { ...debt.feeConfig!, manualAdjustment: 0 } } as Debt);
  const totalFees = autoFees + (debt.feeConfig?.manualAdjustment || 0);
  const totalPaid = debt.history.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0d0d1f] w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#11112b]/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isOwedToMe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} border border-white/5`}>
              {DEBT_ICONS[debt.icon] || DEBT_ICONS.default}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{debt.name}</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Contact Profile</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex p-1 bg-[#050510] border-b border-slate-800 shrink-0">
          <button 
            onClick={() => { hapticFeedback.action(); setActiveTab('details'); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'text-blue-400 bg-blue-500/5' : 'text-slate-600 hover:text-slate-400'}`}
          >
            Details
          </button>
          <button 
            onClick={() => { hapticFeedback.action(); setActiveTab('analytics'); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'text-blue-400 bg-blue-500/5' : 'text-slate-600 hover:text-slate-400'}`}
          >
            Analytics
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">
          {activeTab === 'details' ? (
            <>
              {/* Financial Breakdown */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance Breakdown</h3>
                <div className="bg-[#050510] rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/20">
                  <div className="p-4 flex justify-between items-center"><span className="text-xs text-slate-400">Principal</span><span className="text-xs font-bold text-white">{formatter.format(debt.originalAmount)}</span></div>
                  <div className="p-4 flex justify-between items-start">
                    <div><span className="text-xs text-slate-400 block">Fees & Interest</span></div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-500">{formatter.format(totalFees)}</span>
                      <button onClick={() => setIsEditingFees(!isEditingFees)} className="block text-[8px] font-black text-slate-600 hover:text-white uppercase mt-1">[Edit]</button>
                    </div>
                  </div>
                  {isEditingFees && (
                    <div className="p-4 bg-blue-600/5 flex gap-2 animate-in slide-in-from-top-2">
                      <input type="number" value={manualFeeInput} onChange={e => setManualFeeInput(e.target.value)} className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white" />
                      <button onClick={() => { onUpdateManualFee?.(debt.id, parseFloat(manualFeeInput)||0); setIsEditingFees(false); }} className="bg-blue-600 text-white text-[10px] font-black px-3 rounded-lg">Apply</button>
                    </div>
                  )}
                  <div className="p-4 flex justify-between items-center"><span className="text-xs text-slate-400">Paid</span><span className="text-xs font-bold text-emerald-400">-{formatter.format(totalPaid)}</span></div>
                  <div className="p-5 flex justify-between items-center bg-white/[0.02]"><span className="text-sm font-black text-white uppercase">Net Total</span><span className={`text-xl font-black ${isOwedToMe ? 'text-emerald-400' : 'text-rose-400'}`}>{formatter.format(debt.amount)}</span></div>
                </div>
              </div>

              {/* Repayment Status */}
              {debt.expectedReturnDate && !debt.isSettled && (
                <div className="p-5 bg-blue-600/5 rounded-3xl border border-blue-500/20 space-y-2">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Due Date</h4>
                  <p className="text-xs text-slate-300">
                    Repayment expected by <span className="text-white font-bold">{new Date(debt.expectedReturnDate).toLocaleDateString()}</span>.
                  </p>
                  {new Date() > new Date(debt.expectedReturnDate) && debt.feeConfig?.enabled && (
                    <p className="text-[10px] text-rose-400 font-bold uppercase animate-pulse">
                      Record is Overdue. Fees are currently accumulating.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Trend Chart */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Balance Trend</h3>
                <div className="h-48 w-full bg-[#050510] rounded-3xl border border-slate-800 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={contactAnalytics.trendData}>
                      <defs>
                        <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d0d1f', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category & Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#050510] p-4 rounded-3xl border border-slate-800 space-y-3">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expenses</h3>
                   <div className="h-32">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={contactAnalytics.categoryData} innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value">
                           {contactAnalytics.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                         </Pie>
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-[#050510] p-5 rounded-3xl border border-slate-800 flex flex-col justify-center items-center text-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Interactions</p>
                   <p className="text-3xl font-black text-white">{contactAnalytics.totalInteractions}</p>
                   <p className="text-[9px] text-slate-600 font-bold uppercase mt-2">Lifetime records</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-[#050510]">
          <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest active:scale-95">Close Record</button>
        </div>
      </div>
    </div>
  );
};

export default DebtHistoryModal;

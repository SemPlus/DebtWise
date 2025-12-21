
import React, { useState, useMemo } from 'react';
import { Debt, DebtType } from '../types';
import { DEBT_ICONS } from './IconPicker';

interface ContactsHistoryProps {
  debts: Debt[];
  reliabilityScores: Record<string, number>;
  onViewDebtHistory: (id: string) => void;
}

const ContactsHistory: React.FC<ContactsHistoryProps> = ({ debts, reliabilityScores, onViewDebtHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const groupedHistory = useMemo(() => {
    const groups: Record<string, {
      name: string;
      totalOwedToMe: number;
      totalIOwe: number;
      transactions: Debt[];
      reliability: number;
      traits: string[];
    }> = {};

    debts.forEach(debt => {
      if (!groups[debt.name]) {
        groups[debt.name] = {
          name: debt.name,
          totalOwedToMe: 0,
          totalIOwe: 0,
          transactions: [],
          reliability: reliabilityScores[debt.name] || 0,
          traits: []
        };
      }

      groups[debt.name].transactions.push(debt);
      
      if (!debt.isSettled) {
        if (debt.type === DebtType.OWED_TO_ME) {
          groups[debt.name].totalOwedToMe += debt.amount;
        } else {
          groups[debt.name].totalIOwe += debt.amount;
        }
      }
    });

    // Calculate Dynamic Traits for each contact
    Object.values(groups).forEach(g => {
      const settled = g.transactions.filter(t => t.isSettled);
      const active = g.transactions.filter(t => !t.isSettled);
      
      // Speed Trait
      if (settled.length > 0) {
        const avgDays = settled.reduce((acc, t) => {
          const creation = new Date(t.date);
          const lastPay = t.history.length > 0 ? new Date(t.history[t.history.length-1].date) : creation;
          return acc + (lastPay.getTime() - creation.getTime()) / (1000 * 3600 * 24);
        }, 0) / settled.length;
        
        if (avgDays <= 2) g.traits.push("Flash Payer");
        else if (avgDays <= 7) g.traits.push("Early Settler");
      }

      // Experience Trait
      if (settled.length >= 8) g.traits.push("Legendary Veteran");
      else if (settled.length >= 4) g.traits.push("Consistent Partner");

      // Progress Trait
      const hasProgress = active.some(t => (t.originalAmount - t.amount) / t.originalAmount > 0.3);
      if (hasProgress) g.traits.push("Steady Progress");

      // Risk Trait
      const ghostingThreshold = Date.now() - (15 * 24 * 60 * 60 * 1000);
      const isGhosting = active.some(t => {
        const lastActivity = t.history.length > 0 
          ? new Date(t.history[t.history.length - 1].date).getTime() 
          : new Date(t.date).getTime();
        return lastActivity < ghostingThreshold;
      });
      if (isGhosting) g.traits.push("Ghosting Risk");
    });

    return Object.values(groups)
      .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.transactions.length - a.transactions.length);
  }, [debts, reliabilityScores, searchTerm]);

  const getTrustConfig = (score: number) => {
    if (score >= 90) return { label: 'Pristine', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20', bar: 'bg-emerald-500' };
    if (score >= 70) return { label: 'Reliable', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/20', bar: 'bg-blue-500' };
    if (score >= 40) return { label: 'Developing', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/20', bar: 'bg-amber-500' };
    return { label: 'Delinquent', class: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/20', bar: 'bg-rose-500' };
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Transaction Network</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Sophisticated reputation & ledger analysis
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <input 
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d0d1f] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder-slate-600 shadow-inner"
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groupedHistory.map((contact) => {
          const trust = getTrustConfig(contact.reliability);
          const net = contact.totalOwedToMe - contact.totalIOwe;

          return (
            <div key={contact.name} className="bg-[#0d0d1f] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col group/card hover:border-slate-700 transition-all">
              <div className="p-6 bg-white/[0.02] border-b border-slate-800 flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white group-hover/card:text-blue-400 transition-colors">{contact.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tighter shadow-lg ${trust.class}`}>
                       {trust.label} {Math.round(contact.reliability)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.traits.map(trait => (
                      <span key={trait} className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/5 ${trait === 'Ghosting Risk' ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' : 'text-slate-400'}`}>
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black tracking-tighter ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {net >= 0 ? '+' : ''}{formatter.format(net)}
                  </p>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Net Standing</p>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-grow">
                {/* Reliability Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reliability Meter</span>
                    <span className="text-[10px] font-bold text-slate-300">{Math.round(contact.reliability)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${trust.bar}`}
                      style={{ width: `${contact.reliability}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#050510] p-4 rounded-2xl border border-slate-800/50 hover:bg-[#070718] transition-colors">
                    <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1.5">They Owe</p>
                    <p className="text-sm font-bold text-emerald-400">{formatter.format(contact.totalOwedToMe)}</p>
                  </div>
                  <div className="bg-[#050510] p-4 rounded-2xl border border-slate-800/50 hover:bg-[#070718] transition-colors">
                    <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1.5">You Owe</p>
                    <p className="text-sm font-bold text-rose-400">{formatter.format(contact.totalIOwe)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em]">Transaction Timeline</h4>
                  <div className="space-y-2">
                    {contact.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((t) => (
                      <div 
                        key={t.id} 
                        onClick={() => onViewDebtHistory(t.id)}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-slate-800 transition-all cursor-pointer group/row"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${t.type === DebtType.OWED_TO_ME ? 'text-emerald-500 bg-emerald-500/5' : 'text-rose-500 bg-rose-500/5'} border border-white/5 group-hover/row:scale-110 transition-transform`}>
                            {DEBT_ICONS[t.icon] || DEBT_ICONS.default}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-bold truncate ${t.isSettled ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                              {t.description}
                            </p>
                            <p className="text-[9px] text-slate-500 font-medium">{new Date(t.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className={`text-[11px] font-black ${t.isSettled ? 'text-slate-700' : t.type === DebtType.OWED_TO_ME ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === DebtType.OWED_TO_ME ? '+' : '-'}{formatter.format(t.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {contact.transactions.length > 5 && (
                    <button className="w-full text-center text-[9px] text-slate-500 hover:text-white font-black uppercase tracking-widest pt-2 transition-colors">
                      + {contact.transactions.length - 5} More Interactions
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {groupedHistory.length === 0 && (
        <div className="text-center py-20 bg-[#0d0d1f] rounded-3xl border border-dashed border-slate-800">
           <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">No Reputation Records Found</p>
        </div>
      )}
    </div>
  );
};

export default ContactsHistory;

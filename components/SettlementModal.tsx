
import React, { useState } from 'react';
import { Debt, DebtType } from '../types';
import { hapticFeedback } from '../utils/haptics';

interface SettlementModalProps {
  debt: Debt;
  onClose: () => void;
  onSettle: (id: string, amount: number, date: string) => void;
}

const SettlementModal: React.FC<SettlementModalProps> = ({ debt, onClose, onSettle }) => {
  const [amount, setAmount] = useState(debt.amount.toString());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paidVal = parseFloat(amount);
    if (isNaN(paidVal) || paidVal <= 0) return;
    onSettle(debt.id, paidVal, date);
  };

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0d0d1f] w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#11112b]">
          <h2 className="text-xl font-bold text-white">Settle Record</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center space-y-1">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Remaining Balance for {debt.name}</p>
            <p className="text-3xl font-black text-white">{formatter.format(debt.amount)}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Amount Returned</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 font-bold">$</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  max={debt.amount}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#050510] border border-slate-800 rounded-2xl pl-8 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all text-xl font-black"
                />
              </div>
              <div className="flex justify-between mt-3">
                <button 
                  type="button" 
                  onClick={() => { hapticFeedback.action(); setAmount((debt.amount / 2).toString()); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-[9px] text-slate-400 hover:text-blue-400 uppercase font-black tracking-widest border border-white/5"
                >
                  50% Partial
                </button>
                <button 
                  type="button" 
                  onClick={() => { hapticFeedback.action(); setAmount(debt.amount.toString()); }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-[9px] text-blue-400 hover:bg-blue-600/20 uppercase font-black tracking-widest border border-blue-500/20"
                >
                  Full Settlement
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Return Date</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                </div>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#050510] border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98] flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            Confirm Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettlementModal;

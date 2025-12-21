
import React from 'react';
import { Debt, DebtType } from '../types';
import { DEBT_ICONS } from './IconPicker';

interface DebtCardProps {
  debt: Debt;
  reliabilityScore: number;
  groupName?: string;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onClick: () => void;
}

const DebtCard: React.FC<DebtCardProps> = ({ debt, reliabilityScore, groupName, onSettle, onDelete, onEdit, onClick }) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const isOwedToMe = debt.type === DebtType.OWED_TO_ME;
  const dateStr = new Date(debt.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const paidAmount = debt.originalAmount - debt.amount;
  const progressPercent = Math.min(100, Math.max(0, (paidAmount / debt.originalAmount) * 100));
  const chosenIcon = DEBT_ICONS[debt.icon] || DEBT_ICONS.default;

  // Repayment Schedule Logic
  const dueDateStr = debt.expectedReturnDate ? new Date(debt.expectedReturnDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }) : null;
  const isOverdue = debt.expectedReturnDate && new Date() > new Date(debt.expectedReturnDate) && !debt.isSettled;

  // Trust Level Calculation
  const getTrustLabel = (score: number) => {
    if (score >= 90) return { label: 'Trusted', class: 'bg-emerald-500/10 text-emerald-400' };
    if (score >= 50) return { label: 'Good', class: 'bg-blue-500/10 text-blue-400' };
    if (score > 0) return { label: 'Fair', class: 'bg-amber-500/10 text-amber-400' };
    return { label: 'New', class: 'bg-slate-500/10 text-slate-400' };
  };

  const trust = getTrustLabel(reliabilityScore);

  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col p-4 md:p-5 rounded-2xl border transition-all cursor-pointer group ${debt.isSettled ? 'opacity-50 bg-[#0d0d1f]/40 border-slate-900' : 'bg-[#0d0d1f] border-slate-800 hover:border-slate-700 hover:bg-[#11112b] shadow-xl'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isOwedToMe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {chosenIcon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-bold text-base md:text-lg truncate max-w-[120px] sm:max-w-none ${debt.isSettled ? 'line-through text-slate-500' : 'text-white'}`}>{debt.name}</h4>
              {!debt.isSettled && (
                 <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${trust.class}`}>
                   {trust.label}
                 </span>
              )}
            </div>
            <p className="text-slate-400 text-[10px] md:text-xs truncate max-w-[140px] sm:max-w-xs">{debt.description}</p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className={`text-lg md:text-xl font-black tracking-tight ${isOwedToMe ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isOwedToMe ? '+' : '-'}{formatter.format(debt.amount)}
          </div>
          <div className="flex items-center gap-2 mt-1">
             {groupName && (
               <span className="text-[8px] font-black text-blue-500/80 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">{groupName}</span>
             )}
             <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{dateStr}</span>
          </div>
        </div>
      </div>

      {!debt.isSettled && debt.originalAmount > 0 && (
        <div className="mb-4">
          <div className="h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out rounded-full ${isOwedToMe ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Repayment Schedule Section */}
      {!debt.isSettled && dueDateStr && (
        <div className="mb-4 p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expected Repayment</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isOverdue ? 'text-rose-500' : 'text-blue-400'}`}>
              {isOverdue ? 'Overdue' : 'Due Soon'}
            </span>
          </div>
          <div className="flex justify-between items-center">
             <p className="text-[11px] font-bold text-slate-200">
               {formatter.format(debt.amount)} by {dueDateStr}
             </p>
             {debt.feeConfig?.enabled && (
               <p className="text-[8px] text-slate-500 italic">
                 {isOverdue ? 'Fees actively accumulating' : 'Fees apply after this date'}
               </p>
             )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/40" onClick={stopPropagation}>
        <div className="flex items-center gap-2">
          {!debt.isSettled ? (
            <button 
              onClick={() => onSettle(debt.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/20 active:scale-95"
            >
              Settle
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Settled</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 transition-opacity">
          <button 
            onClick={() => onEdit(debt.id)}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all active:scale-90"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(debt.id)}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebtCard;

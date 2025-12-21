
import React from 'react';
import { Debt, Group } from '../types';
import DebtCard from './DebtCard';

interface DebtListProps {
  debts: Debt[];
  reliabilityScores: Record<string, number>;
  groups: Group[];
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onViewHistory: (id: string) => void;
}

const DebtList: React.FC<DebtListProps> = ({ debts, reliabilityScores, groups, onSettle, onDelete, onEdit, onViewHistory }) => {
  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#0d0d1f] rounded-2xl border border-dashed border-slate-700">
        <div className="bg-slate-800/50 p-4 rounded-full mb-4">
          <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white">No records found</h3>
        <p className="text-slate-400 mt-2 max-w-xs">Start tracking your loans and debts by clicking the 'Add New' button.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debts.map(debt => (
        <DebtCard 
          key={debt.id} 
          debt={debt} 
          reliabilityScore={reliabilityScores[debt.name] || 0}
          groupName={groups.find(g => g.id === debt.groupId)?.name}
          onSettle={onSettle} 
          onDelete={onDelete}
          onEdit={onEdit}
          onClick={() => onViewHistory(debt.id)}
        />
      ))}
    </div>
  );
};

export default DebtList;


import React, { useState, useEffect, useMemo } from 'react';
import { Debt, DebtType, BalanceState, Payment, Group } from './types';
import Dashboard from './components/Dashboard';
import DebtList from './components/DebtList';
import AddDebtModal from './components/AddDebtModal';
import TrendsChart from './components/TrendsChart';
import SettlementModal from './components/SettlementModal';
import DebtHistoryModal from './components/DebtHistoryModal';
import GroupSwitcher from './components/GroupSwitcher';
import ContactsHistory from './components/ContactsHistory';
import DataManagement from './components/DataManagement';
import { hapticFeedback } from './utils/haptics';
import { getDebtTotalWithFees } from './utils/feeCalculator';
import { useRegisterSW } from 'virtual:pwa-register/react';

const App: React.FC = () => {
  // PWA Update Logic
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [currentView, setCurrentView] = useState<'dashboard' | 'history'>('dashboard');
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('groups');
    return saved ? JSON.parse(saved) : [
      { id: 'personal', name: 'Personal', color: 'blue' },
      { id: 'roommates', name: 'Roommates', color: 'emerald' },
      { id: 'work', name: 'Work', color: 'purple' }
    ];
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem('debts');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((d: any) => ({
        ...d,
        originalAmount: d.originalAmount ?? d.amount,
        icon: d.icon ?? 'default',
        history: d.history ?? [],
        feeConfig: d.feeConfig ?? { enabled: false, type: 'FIXED', frequency: 'ONCE', value: 0, manualAdjustment: 0 }
      }));
    }
    return [];
  });

  const [activeGroupId, setActiveGroupId] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [settlementDebtId, setSettlementDebtId] = useState<string | null>(null);
  const [historyDebtId, setHistoryDebtId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | DebtType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  const debtsWithUpdatedFees = useMemo(() => {
    return debts.map(d => ({
      ...d,
      amount: getDebtTotalWithFees(d)
    }));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('debts', JSON.stringify(debts));
    localStorage.setItem('groups', JSON.stringify(groups));
  }, [debts, groups]);

  const balances = useMemo<BalanceState>(() => {
    const activeDebts = activeGroupId === 'ALL'
      ? debtsWithUpdatedFees
      : debtsWithUpdatedFees.filter(d => d.groupId === activeGroupId);

    const totalIOwe = activeDebts
      .filter(d => d.type === DebtType.I_OWE && !d.isSettled)
      .reduce((acc, d) => acc + d.amount, 0);
    const totalOwedToMe = activeDebts
      .filter(d => d.type === DebtType.OWED_TO_ME && !d.isSettled)
      .reduce((acc, d) => acc + d.amount, 0);
    return {
      totalIOwe,
      totalOwedToMe,
      netBalance: totalOwedToMe - totalIOwe
    };
  }, [debtsWithUpdatedFees, activeGroupId]);

  const reliabilityScores = useMemo(() => {
    const scores: Record<string, number> = {};
    const contacts: Record<string, Debt[]> = {};

    debtsWithUpdatedFees.forEach(d => {
      if (!contacts[d.name]) contacts[d.name] = [];
      contacts[d.name].push(d);
    });

    Object.keys(contacts).forEach(name => {
      const contactDebts = contacts[name];
      let weightedPoints = 0;
      let maxPossibleWeight = 0;

      contactDebts.forEach(debt => {
        const volumeWeight = Math.log10(debt.originalAmount + 1) + 1;
        const recencyFactor = (Date.now() - new Date(debt.date).getTime()) < (45 * 24 * 60 * 60 * 1000) ? 1.5 : 1;
        const finalWeight = volumeWeight * recencyFactor;
        maxPossibleWeight += finalWeight;

        if (debt.isSettled) {
          let successMultiplier = 1.0;
          const creationDate = new Date(debt.date);
          const lastPaymentDate = debt.history.length > 0
            ? new Date(debt.history[debt.history.length - 1].date)
            : creationDate;
          const daysToSettle = (lastPaymentDate.getTime() - creationDate.getTime()) / (1000 * 3600 * 24);

          if (daysToSettle <= 2) successMultiplier = 1.4;
          else if (daysToSettle <= 7) successMultiplier = 1.2;
          else if (daysToSettle > 60) successMultiplier = 0.6;

          weightedPoints += (finalWeight * successMultiplier);
        } else {
          const progressPercent = (debt.originalAmount - debt.amount) / debt.originalAmount;
          let commitmentPoints = finalWeight * Math.max(0, progressPercent) * 0.8;
          const lastActivityDate = debt.history.length > 0 ? new Date(debt.history[debt.history.length - 1].date) : new Date(debt.date);
          const daysSinceActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 3600 * 24);
          if (daysSinceActivity > 14) {
            const decayFactor = Math.max(0, 1 - ((daysSinceActivity - 14) / 60));
            commitmentPoints *= decayFactor;
          }
          weightedPoints += commitmentPoints;
        }
      });

      const settledCount = contactDebts.filter(d => d.isSettled).length;
      const experienceMultiplier = Math.min(1.2, 1 + (settledCount * 0.02));
      const rawScore = (weightedPoints / maxPossibleWeight) * 100;
      scores[name] = Math.max(0, Math.min(100, rawScore * experienceMultiplier));
    });

    return scores;
  }, [debtsWithUpdatedFees]);

  const filteredDebts = useMemo(() => {
    return debtsWithUpdatedFees
      .filter(d => {
        const typeMatch = filterType === 'ALL' || d.type === filterType;
        const statusMatch = statusFilter === 'ALL' || !d.isSettled;
        const groupMatch = activeGroupId === 'ALL' || d.groupId === activeGroupId;
        return typeMatch && statusMatch && groupMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debtsWithUpdatedFees, filterType, statusFilter, activeGroupId]);

  const savedNames = useMemo(() => {
    const names = new Set<string>();
    debts.forEach(d => names.add(d.name));
    return Array.from(names);
  }, [debts]);

  const handleAddDebts = (newDebts: any[]) => {
    hapticFeedback.success();
    const formattedDebts: Debt[] = newDebts.map(d => ({
      ...d,
      id: Math.random().toString(36).substr(2, 9),
      isSettled: false,
      history: [],
      originalAmount: d.amount,
      feeConfig: d.feeConfig || { enabled: false, type: 'FIXED', frequency: 'ONCE', value: 0, manualAdjustment: 0 }
    }));
    setDebts(prev => [...formattedDebts, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleUpdateDebt = (updatedFields: any) => {
    if (!editingDebtId) return;
    hapticFeedback.action();
    setDebts(prev => prev.map(d => {
      if (d.id === editingDebtId) {
        return {
          ...d,
          ...updatedFields,
          originalAmount: updatedFields.amount,
        };
      }
      return d;
    }));
    setEditingDebtId(null);
    setIsAddModalOpen(false);
  };

  const handleProcessSettlement = (id: string, paidAmount: number, date: string) => {
    hapticFeedback.success();
    setDebts(prev => prev.map(d => {
      if (d.id === id) {
        const currentAmount = getDebtTotalWithFees(d);
        const newRemaining = Math.max(0, currentAmount - paidAmount);
        const newHistoryItem: Payment = {
          id: Math.random().toString(36).substr(2, 5),
          amount: paidAmount,
          date: date
        };
        return {
          ...d,
          isSettled: newRemaining <= 0,
          history: [...d.history, newHistoryItem]
        };
      }
      return d;
    }));
    setSettlementDebtId(null);
  };

  const handleRemoveGroup = (groupId: string) => {
    if (groupId === 'personal') {
      hapticFeedback.error();
      alert("The 'Personal' group cannot be deleted.");
      return;
    }
    if (confirm("Are you sure you want to delete this group? All debts in this group will be moved to 'Personal'.")) {
      hapticFeedback.warning();
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setDebts(prev => prev.map(d => d.groupId === groupId ? { ...d, groupId: 'personal' } : d));
      if (activeGroupId === groupId) setActiveGroupId('ALL');
    }
  };

  const handleImportData = (data: { debts: Debt[]; groups: Group[] }) => {
    setDebts(data.debts);
    setGroups(data.groups);
  };

  const currentSettlementDebt = debtsWithUpdatedFees.find(d => d.id === settlementDebtId);
  const currentHistoryDebt = debtsWithUpdatedFees.find(d => d.id === historyDebtId);
  const currentEditingDebt = debtsWithUpdatedFees.find(d => d.id === editingDebtId);

  return (
    <div className="min-h-screen pb-10 px-4 md:px-10 lg:px-24 pt-6 md:pt-10 flex flex-col">
      <div className="flex-grow">
        <header className="flex justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white">DebtWise</h1>
            <p className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-widest mt-0.5 opacity-60">Smart Financial Ledger</p>
          </div>
          <button
            onClick={() => { hapticFeedback.action(); setEditingDebtId(null); setIsAddModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 active:scale-95"
          >
            <span className="text-xl leading-none">+</span>
            <span className="text-sm">Add New</span>
          </button>
        </header>

        {needRefresh && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-blue-600/90 backdrop-blur-md border border-blue-400/30 p-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <div className="text-white">
              <p className="text-xs font-black uppercase tracking-wider">Update Available!</p>
              <p className="text-[10px] opacity-80">Reload to use the latest version.</p>
            </div>
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95"
            >
              Reload
            </button>
          </div>
        )}

        <div className="relative flex p-1 bg-[#0d0d1f] border border-slate-800 rounded-2xl mb-10 self-start w-full sm:w-80 shadow-inner overflow-hidden">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-xl transition-all duration-300 ease-out shadow-lg shadow-blue-900/30 ${currentView === 'dashboard' ? 'left-1' : 'left-[calc(50%+1px)]'}`} />
          <button onClick={() => { hapticFeedback.action(); setCurrentView('dashboard'); }} className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-300 text-center ${currentView === 'dashboard' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}>Dashboard</button>
          <button onClick={() => { hapticFeedback.action(); setCurrentView('history'); }} className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-300 text-center ${currentView === 'history' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}>Network</button>
        </div>

        {currentView === 'dashboard' ? (
          <>
            <Dashboard balances={balances} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <div className="lg:col-span-2 space-y-6">
                <GroupSwitcher groups={groups} activeGroupId={activeGroupId} onSelect={(id) => { hapticFeedback.action(); setActiveGroupId(id); }} onRemoveGroup={handleRemoveGroup} onAddGroup={(name) => { hapticFeedback.success(); setGroups([...groups, { id: Math.random().toString(36).substr(2, 5), name, color: 'blue' }]); }} />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0d1f] p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {['ALL', DebtType.I_OWE, DebtType.OWED_TO_ME].map(type => (
                      <button key={type} onClick={() => { hapticFeedback.action(); setFilterType(type as any); }} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{type === 'ALL' ? 'All Types' : type === DebtType.I_OWE ? 'I Owe' : 'Owed'}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#050510] rounded-xl p-1 border border-slate-800">
                    <button onClick={() => { hapticFeedback.action(); setStatusFilter('ACTIVE'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'ACTIVE' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>Active</button>
                    <button onClick={() => { hapticFeedback.action(); setStatusFilter('ALL'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>History</button>
                  </div>
                </div>
                <DebtList debts={filteredDebts} reliabilityScores={reliabilityScores} groups={groups} onSettle={(id) => { hapticFeedback.action(); setSettlementDebtId(id); }} onDelete={(id) => { hapticFeedback.warning(); setDebts(debts.filter(d => d.id !== id)); }} onEdit={(id) => { hapticFeedback.action(); setEditingDebtId(id); setIsAddModalOpen(true); }} onViewHistory={(id) => { hapticFeedback.action(); setHistoryDebtId(id); }} />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <TrendsChart debts={debtsWithUpdatedFees} />
              </div>
            </div>
            <DataManagement debts={debts} groups={groups} onImport={handleImportData} />
          </>
        ) : (
          <ContactsHistory debts={debtsWithUpdatedFees} reliabilityScores={reliabilityScores} onViewDebtHistory={(id) => { hapticFeedback.action(); setHistoryDebtId(id); }} />
        )}
      </div>

      {isAddModalOpen && <AddDebtModal initialData={currentEditingDebt} savedNames={savedNames} groups={groups} onClose={() => { setIsAddModalOpen(false); setEditingDebtId(null); }} onSubmit={editingDebtId ? (d) => handleUpdateDebt(d[0]) : handleAddDebts} />}
      {currentSettlementDebt && <SettlementModal debt={currentSettlementDebt} onClose={() => setSettlementDebtId(null)} onSettle={handleProcessSettlement} />}
      {currentHistoryDebt && <DebtHistoryModal debt={currentHistoryDebt} allDebts={debtsWithUpdatedFees} onClose={() => setHistoryDebtId(null)} onUpdateManualFee={(id, fee) => { hapticFeedback.action(); setDebts(prev => prev.map(d => d.id === id ? { ...d, feeConfig: { ...d.feeConfig!, manualAdjustment: fee } } : d)); }} />}
    </div>
  );
};

export default App;

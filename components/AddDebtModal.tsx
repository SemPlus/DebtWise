
import React, { useState, useEffect, useMemo } from 'react';
import { Debt, DebtType, Group, FeeConfig } from '../types';
import { IconPicker } from './IconPicker';
import { hapticFeedback } from '../utils/haptics';

type SplitMode = 'EQUALLY' | 'PERCENTAGE' | 'EXACT';

interface Participant {
  name: string;
  value: string;
}

interface AddDebtModalProps {
  initialData?: Debt;
  savedNames?: string[];
  groups: Group[];
  onClose: () => void;
  onSubmit: (debts: any[]) => void;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({ initialData, savedNames = [], groups, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: DebtType.OWED_TO_ME,
    date: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    icon: 'default',
    groupId: 'personal'
  });

  const [feeConfig, setFeeConfig] = useState<FeeConfig>({
    enabled: false,
    type: 'FIXED',
    frequency: 'ONCE',
    value: 0,
    manualAdjustment: 0
  });

  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitType, setSplitType] = useState<SplitMode>('EQUALLY');
  const [totalBill, setTotalBill] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [nameSearch, setNameSearch] = useState('');
  const [showNameMenu, setShowNameMenu] = useState(false);
  const [isContactPickerSupported, setIsContactPickerSupported] = useState(false);

  useEffect(() => {
    // @ts-ignore - Contacts API is not in all typings yet
    if ('contacts' in navigator && 'ContactsManager' in window) {
      setIsContactPickerSupported(true);
    }
  }, []);

  const handleImportContact = async () => {
    try {
      hapticFeedback.action();
      // @ts-ignore
      const props = ['name'];
      const opts = { multiple: isSplitMode };
      // @ts-ignore
      const contacts = await navigator.contacts.select(props, opts);

      if (contacts && contacts.length > 0) {
        if (isSplitMode) {
          const newParticipants = contacts.map((c: any) => ({ name: c.name[0], value: '' }));
          setParticipants(prev => [...prev, ...newParticipants]);
        } else {
          setFormData(prev => ({ ...prev, name: contacts[0].name[0] }));
        }
        hapticFeedback.success();
      }
    } catch (err) {
      console.error('Contact picker error:', err);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        amount: initialData.originalAmount.toString(),
        type: initialData.type,
        date: initialData.date,
        expectedReturnDate: initialData.expectedReturnDate || '',
        icon: initialData.icon || 'default',
        groupId: initialData.groupId || 'personal'
      });
      if (initialData.feeConfig) setFeeConfig(initialData.feeConfig);
      setIsSplitMode(false);
    }
  }, [initialData]);

  const filteredSavedNames = useMemo(() => {
    const search = nameSearch.toLowerCase().trim();
    return savedNames.filter(name =>
      name.toLowerCase().includes(search) &&
      !participants.some(p => p.name === name)
    );
  }, [savedNames, nameSearch, participants]);

  const addParticipant = (name: string) => {
    if (!name.trim()) return;
    setParticipants([...participants, { name: name.trim(), value: '' }]);
    setNameSearch('');
    setShowNameMenu(false);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipantValue = (index: number, value: string) => {
    const next = [...participants];
    next[index].value = value;
    setParticipants(next);
  };

  const calculateFinalDebts = () => {
    const total = parseFloat(totalBill);
    if (isNaN(total)) return [];

    const baseData = {
      description: formData.description || 'Split bill',
      type: formData.type,
      date: formData.date,
      expectedReturnDate: formData.expectedReturnDate,
      icon: formData.icon,
      groupId: formData.groupId,
      feeConfig: feeConfig
    };

    if (splitType === 'EQUALLY') {
      const perPerson = total / participants.length;
      return participants.map(p => ({ ...baseData, name: p.name, amount: parseFloat(perPerson.toFixed(2)) }));
    } else if (splitType === 'PERCENTAGE') {
      return participants.map(p => {
        const pct = parseFloat(p.value) || 0;
        return { ...baseData, name: p.name, amount: parseFloat(((total * pct) / 100).toFixed(2)) };
      });
    } else {
      return participants.map(p => ({ ...baseData, name: p.name, amount: parseFloat(p.value) || 0 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSplitMode) {
      if (participants.length === 0 || !totalBill) return;
      onSubmit(calculateFinalDebts());
    } else {
      if (!formData.name || !formData.amount) return;
      onSubmit([{
        ...formData,
        amount: parseFloat(formData.amount),
        description: formData.description || 'No description',
        feeConfig: feeConfig
      }]);
    }
  };

  const setQuickDate = (days: number) => {
    hapticFeedback.action();
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFormData({ ...formData, expectedReturnDate: date.toISOString().split('T')[0] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0d0d1f] w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-white">{initialData ? 'Edit Record' : 'Add Record'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto no-scrollbar">
          {/* Record Type Toggle */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Record Type</label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#050510] rounded-2xl border border-slate-800/50">
              <button
                type="button"
                onClick={() => { hapticFeedback.action(); setFormData({ ...formData, type: DebtType.OWED_TO_ME }); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${formData.type === DebtType.OWED_TO_ME ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:text-white'}`}
              >
                Owed to Me
              </button>
              <button
                type="button"
                onClick={() => { hapticFeedback.action(); setFormData({ ...formData, type: DebtType.I_OWE }); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${formData.type === DebtType.I_OWE ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-slate-400 hover:text-white'}`}
              >
                I Owe
              </button>
            </div>
          </div>

          {/* Custom Group Selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Assign to Group</label>
            <div className="grid grid-cols-3 gap-2">
              {groups.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => { hapticFeedback.action(); setFormData({ ...formData, groupId: g.id }); }}
                  className={`relative p-3 rounded-2xl border text-center transition-all ${formData.groupId === g.id ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-[#050510] border-slate-800 hover:border-slate-700'}`}
                >
                  <div className={`text-[10px] font-bold ${formData.groupId === g.id ? 'text-blue-400' : 'text-slate-400'}`}>{g.name}</div>
                  {formData.groupId === g.id && (
                    <div className="absolute top-1.5 right-1.5">
                      <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Styled Date Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                </div>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[#050510] border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white text-xs font-bold [color-scheme:dark] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Due Date (Optional)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <input
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={e => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  className="w-full bg-[#050510] border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white text-xs font-bold [color-scheme:dark] outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex gap-2 -mt-2">
            {[
              { label: 'Today', days: 0 },
              { label: '+1 Week', days: 7 },
              { label: '+1 Month', days: 30 }
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setQuickDate(preset.days)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-slate-400 uppercase hover:bg-white/10 hover:text-white transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Splitting Toggle */}
          {!initialData && (
            <div className="flex items-center justify-between p-4 bg-[#11112b] rounded-2xl border border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-white">Split with others?</span>
              </div>
              <button
                type="button"
                onClick={() => { hapticFeedback.action(); setIsSplitMode(!isSplitMode); }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSplitMode ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSplitMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          {isSplitMode ? (
            <div className="space-y-6 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Total Amount"
                  value={totalBill}
                  onChange={e => setTotalBill(e.target.value)}
                  className="bg-[#050510] border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none font-bold"
                />
                <select
                  value={splitType}
                  onChange={e => setSplitType(e.target.value as SplitMode)}
                  className="bg-[#050510] border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs font-bold"
                >
                  <option value="EQUALLY">Equally</option>
                  <option value="PERCENTAGE">%</option>
                  <option value="EXACT">$</option>
                </select>
              </div>

              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search or add name..."
                    value={nameSearch}
                    onFocus={() => setShowNameMenu(true)}
                    onChange={e => setNameSearch(e.target.value)}
                    className="flex-grow bg-[#050510] border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs outline-none"
                  />
                  {isContactPickerSupported && (
                    <button
                      type="button"
                      onClick={handleImportContact}
                      className="px-3 bg-slate-800 text-blue-400 rounded-2xl border border-blue-500/20 active:scale-95 transition-transform"
                      title="Import from contacts"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </button>
                  )}
                  <button type="button" onClick={() => addParticipant(nameSearch)} className="px-4 bg-blue-600 text-white rounded-2xl">+</button>
                </div>
                {showNameMenu && filteredSavedNames.length > 0 && nameSearch && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#11112b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto no-scrollbar">
                    {filteredSavedNames.map(name => (
                      <button key={name} type="button" onClick={() => addParticipant(name)} className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-blue-600 hover:text-white border-b border-slate-800/50 last:border-none">{name}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {participants.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-[#050510] rounded-2xl border border-slate-800/50">
                    <span className="flex-grow text-xs font-bold text-white truncate">{p.name}</span>
                    {splitType !== 'EQUALLY' && (
                      <input
                        type="number"
                        value={p.value}
                        onChange={e => updateParticipantValue(idx, e.target.value)}
                        className="w-20 bg-[#11112b] border border-slate-800 rounded-xl px-2 py-1 text-xs text-white text-right outline-none"
                      />
                    )}
                    <button type="button" onClick={() => removeParticipant(idx)} className="text-slate-500 hover:text-rose-500">×</button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Who</label>
                <div className="relative flex gap-2">
                  <input
                    required
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onFocus={() => setShowNameMenu(true)}
                    onChange={e => {
                      setFormData({ ...formData, name: e.target.value });
                      setNameSearch(e.target.value);
                    }}
                    className="flex-grow bg-[#050510] border border-slate-800 rounded-2xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none font-medium text-sm"
                  />
                  {isContactPickerSupported && (
                    <button
                      type="button"
                      onClick={handleImportContact}
                      className="px-3 bg-slate-800 text-blue-400 rounded-2xl border border-blue-500/20 active:scale-95 transition-transform"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </button>
                  )}
                  {showNameMenu && filteredSavedNames.length > 0 && nameSearch && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#11112b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto no-scrollbar">
                      {filteredSavedNames.map(name => (
                        <button key={name} type="button" onClick={() => { hapticFeedback.action(); setFormData({ ...formData, name }); setShowNameMenu(false); }} className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-blue-600 hover:text-white border-b border-slate-800/50 last:border-none">{name}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Amount ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-[#050510] border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none font-bold text-xl"
                />
              </div>
            </div>
          )}

          {/* Interests and Late Fees Section */}
          <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Interests & Fees</h3>
                <p className="text-[10px] text-slate-500">Automate late penalties or interest</p>
              </div>
              <button
                type="button"
                onClick={() => { hapticFeedback.action(); setFeeConfig({ ...feeConfig, enabled: !feeConfig.enabled }); }}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${feeConfig.enabled ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${feeConfig.enabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>

            {feeConfig.enabled && (
              <div className="space-y-4 pt-2 border-t border-blue-500/10 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Frequency</label>
                    <select
                      value={feeConfig.frequency}
                      onChange={(e) => setFeeConfig({ ...feeConfig, frequency: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-bold text-white outline-none"
                    >
                      <option value="ONCE">One-time</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Type</label>
                    <select
                      value={feeConfig.type}
                      onChange={(e) => setFeeConfig({ ...feeConfig, type: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-bold text-white outline-none"
                    >
                      <option value="FIXED">Fixed Amount ($)</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                    Value ({feeConfig.type === 'FIXED' ? '$' : '%'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={feeConfig.value}
                    onChange={(e) => setFeeConfig({ ...feeConfig, value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category Icon</label>
            <IconPicker selectedIcon={formData.icon} onSelect={(icon) => setFormData({ ...formData, icon })} />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</label>
            <textarea
              placeholder="What was this for?"
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#050510] border border-slate-800 rounded-2xl px-4 py-3 text-white resize-none text-xs font-medium outline-none"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg text-sm uppercase tracking-widest active:scale-95">
            {initialData ? 'Save Changes' : 'Add Record'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDebtModal;

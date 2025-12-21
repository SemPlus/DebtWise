
import React, { useState } from 'react';
import { Group } from '../types';

interface GroupSwitcherProps {
  groups: Group[];
  activeGroupId: string;
  onSelect: (id: string) => void;
  onAddGroup: (name: string) => void;
  onRemoveGroup: (id: string) => void;
}

const GroupSwitcher: React.FC<GroupSwitcherProps> = ({ groups, activeGroupId, onSelect, onAddGroup, onRemoveGroup }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddGroup(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      <button
        onClick={() => onSelect('ALL')}
        className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
          activeGroupId === 'ALL' 
            ? 'bg-white text-slate-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
            : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-600'
        }`}
      >
        All Funds
      </button>

      {groups.map((group) => (
        <div key={group.id} className="relative group/item flex items-center">
          <button
            onClick={() => onSelect(group.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
              activeGroupId === group.id 
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-600'
            }`}
          >
            <span>{group.name}</span>
            {group.id !== 'personal' && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveGroup(group.id);
                }}
                className={`ml-1 flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                   activeGroupId === group.id 
                    ? 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white' 
                    : 'bg-slate-800 hover:bg-rose-500/20 text-slate-600 hover:text-rose-500'
                }`}
                title="Delete group"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </button>
        </div>
      ))}

      {isAdding ? (
        <form onSubmit={handleAdd} className="flex items-center gap-1 min-w-[140px] animate-in fade-in slide-in-from-left-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => !newName && setIsAdding(false)}
            placeholder="Group name..."
            className="w-full bg-slate-900 border border-blue-500 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none"
          />
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 rounded-full border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600 transition-all flex items-center gap-1 px-3"
        >
          <span className="text-lg leading-none">+</span>
          <span className="text-[10px] font-black uppercase">New Group</span>
        </button>
      )}
    </div>
  );
};

export default GroupSwitcher;

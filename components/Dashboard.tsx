import React from 'react';
import { BalanceState } from '../types';

interface DashboardProps {
  balances: BalanceState;
}

const Dashboard: React.FC<DashboardProps> = ({ balances }) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0, // Simplified for the dashboard view to save space
  });

  const total = balances.totalIOwe + balances.totalOwedToMe;
  const owePercent = total > 0 ? (balances.totalIOwe / total) * 100 : 50;
  const owedPercent = total > 0 ? (balances.totalOwedToMe / total) * 100 : 50;

  return (
    <div className="bg-[#0d0d1f] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative">
      {/* Dynamic background glow based on balance status */}
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] rounded-full opacity-[0.08] pointer-events-none transition-colors duration-700 ${balances.netBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

      <div className="relative z-10">
        {/* Strictly horizontal layout for all screen sizes */}
        <div className="flex flex-row items-center divide-x divide-slate-800">
          
          {/* Left Segment: Total Debt */}
          <div className="flex-1 p-3 md:p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] md:text-[10px] font-black text-rose-500/80 uppercase tracking-widest mb-1">Debt</span>
            <span className="text-sm md:text-xl font-bold text-white truncate w-full px-1">
              {formatter.format(balances.totalIOwe)}
            </span>
          </div>

          {/* Center Segment: Net Balance (Hero) */}
          <div className="flex-[1.5] py-5 md:py-8 flex flex-col items-center justify-center text-center bg-white/[0.02]">
            <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Net Balance</span>
            <span className={`text-xl md:text-4xl font-black tracking-tighter ${balances.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatter.format(balances.netBalance)}
            </span>
          </div>

          {/* Right Segment: Total Credit */}
          <div className="flex-1 p-3 md:p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] md:text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-1">Credit</span>
            <span className="text-sm md:text-xl font-bold text-white truncate w-full px-1">
              {formatter.format(balances.totalOwedToMe)}
            </span>
          </div>

        </div>
      </div>

      {/* Footer Visual: Balance Ratio Bar */}
      <div className="h-1.5 w-full bg-slate-900 flex overflow-hidden">
        <div 
          className="h-full bg-rose-500 transition-all duration-1000 ease-in-out relative" 
          style={{ width: `${owePercent}%` }}
        >
           <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        </div>
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-in-out relative" 
          style={{ width: `${owedPercent}%` }}
        >
           <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
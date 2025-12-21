
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend
} from 'recharts';
import { Debt, DebtType } from '../types';

interface TrendsChartProps {
  debts: Debt[];
}

type ChartTab = 'trends' | 'categories' | 'contacts';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const TrendsChart: React.FC<TrendsChartProps> = ({ debts }) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('trends');

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  // Process data for Monthly Trends
  const trendData = useMemo(() => {
    const months: Record<string, { month: string, owe: number, owed: number }> = {};
    debts.forEach(debt => {
      if (debt.isSettled) return;
      const date = new Date(debt.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, owe: 0, owed: 0 };
      }
      
      if (debt.type === DebtType.I_OWE) {
        months[monthKey].owe += debt.amount;
      } else {
        months[monthKey].owed += debt.amount;
      }
    });
    return Object.values(months);
  }, [debts]);

  // Process data for Category Breakdown
  const categoryData = useMemo(() => {
    const cats: Record<string, { name: string, value: number }> = {};
    debts.filter(d => !d.isSettled).forEach(debt => {
      const categoryName = debt.icon.charAt(0).toUpperCase() + debt.icon.slice(1);
      if (!cats[categoryName]) {
        cats[categoryName] = { name: categoryName, value: 0 };
      }
      cats[categoryName].value += debt.amount;
    });
    return Object.values(cats).sort((a, b) => b.value - a.value);
  }, [debts]);

  // Process data for Top Contacts
  const contactData = useMemo(() => {
    const people: Record<string, { name: string, amount: number, type: DebtType }> = {};
    debts.filter(d => !d.isSettled).forEach(debt => {
      if (!people[debt.name]) {
        people[debt.name] = { name: debt.name, amount: 0, type: debt.type };
      }
      people[debt.name].amount += debt.amount;
    });
    return Object.values(people)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [debts]);

  return (
    <div className="bg-[#0d0d1f] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Financial Analytics</h3>
          <div className="flex gap-1.5 p-1 bg-[#050510] rounded-xl border border-slate-800">
            {(['trends', 'categories', 'contacts'] as ChartTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 h-[240px] w-full relative">
        {debts.filter(d => !d.isSettled).length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'trends' ? (
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} 
                  dy={10}
                />
                <YAxis hide />
                <Bar name="Credit" dataKey="owed" radius={[4, 4, 0, 0]} barSize={16}>
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-owed-${index}`} fill="#10b981" />
                  ))}
                </Bar>
                <Bar name="Debt" dataKey="owe" radius={[4, 4, 0, 0]} barSize={16}>
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-owe-${index}`} fill="#f43f5e" />
                  ))}
                </Bar>
              </BarChart>
            ) : activeTab === 'categories' ? (
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart 
                layout="vertical" 
                data={contactData} 
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={60}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Bar name="Volume" dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
                  {contactData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.type === DebtType.I_OWE ? '#f43f5e' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-slate-900/50 rounded-full">
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Not enough active data</p>
          </div>
        )}
      </div>

      {/* Data Summary Section for Mobile - Replaces Tooltips */}
      <div className="px-5 pb-5 space-y-2">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Detailed Breakdown</h4>
        <div className="grid gap-2">
          {activeTab === 'trends' && trendData.slice(-3).reverse().map((d, i) => (
            <div key={i} className="flex justify-between items-center bg-[#050510] p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-white uppercase">{d.month}</span>
              <div className="flex gap-4">
                <span className="text-[10px] font-bold text-emerald-500">+{formatter.format(d.owed)}</span>
                <span className="text-[10px] font-bold text-rose-500">-{formatter.format(d.owe)}</span>
              </div>
            </div>
          ))}
          {activeTab === 'categories' && categoryData.slice(0, 4).map((d, i) => (
            <div key={i} className="flex justify-between items-center bg-[#050510] p-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-[10px] font-bold text-white uppercase">{d.name}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-300">{formatter.format(d.value)}</span>
            </div>
          ))}
          {activeTab === 'contacts' && contactData.map((d, i) => (
            <div key={i} className="flex justify-between items-center bg-[#050510] p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-white uppercase truncate max-w-[100px]">{d.name}</span>
              <span className={`text-[10px] font-bold ${d.type === DebtType.I_OWE ? 'text-rose-500' : 'text-emerald-500'}`}>
                {formatter.format(d.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-900/20 border-t border-slate-800/50 flex justify-between items-center">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          {activeTab === 'trends' ? 'Monthly Flow' : activeTab === 'categories' ? 'Distribution' : 'Top Partners'}
        </span>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
        </div>
      </div>
    </div>
  );
};

export default TrendsChart;


import React, { useState } from 'react';
import { Debt } from '../types';
import { getDebtInsights } from '../geminiService';

interface AIInsightsProps {
  debts: Debt[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ debts }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const result = await getDebtInsights(debts);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900/50 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 bg-indigo-500/20 rounded-lg text-indigo-400 ${loading ? 'animate-pulse' : ''}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">AI Financial Insights</h3>
      </div>
      
      <div className="relative min-h-[60px] flex items-center">
        {loading ? (
          <div className="w-full space-y-2">
            <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2 animate-pulse"></div>
          </div>
        ) : insight ? (
          <p className="text-slate-300 text-sm leading-relaxed italic">
            "{insight}"
          </p>
        ) : (
          <p className="text-slate-500 text-sm italic">
            Tap the button below to generate intelligent insights based on your current debts.
          </p>
        )}
      </div>

      <button 
        onClick={fetchInsights}
        disabled={loading}
        className="mt-4 w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-bold py-2.5 rounded-lg transition-all border border-indigo-500/30 flex items-center justify-center gap-2 group disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : insight ? 'Refresh Analysis' : 'Generate Insight'}
        {!loading && (
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default AIInsights;

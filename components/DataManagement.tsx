
import React, { useRef } from 'react';
import { Debt, Group } from '../types';
import { hapticFeedback } from '../utils/haptics';

interface DataManagementProps {
    debts: Debt[];
    groups: Group[];
    onImport: (data: { debts: Debt[]; groups: Group[] }) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ debts, groups, onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        hapticFeedback.success();
        const data = {
            debts,
            groups,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `debtwise-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        hapticFeedback.action();
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedData = JSON.parse(content);

                // Basic validation
                if (!importedData.debts || !Array.isArray(importedData.debts)) {
                    throw new Error('Invalid backup format: Missing debts');
                }

                if (confirm('Importing this file will replace all your current data. Are you sure?')) {
                    onImport({
                        debts: importedData.debts,
                        groups: importedData.groups || []
                    });
                    hapticFeedback.success();
                    alert('Data imported successfully!');
                }
            } catch (error) {
                hapticFeedback.error();
                alert('Failed to import data. Please make sure the file is a valid DebtWise backup.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        // Reset input so the same file can be selected again
        event.target.value = '';
    };

    return (
        <div className="mt-12 mb-8 p-6 bg-[#0d0d1f] rounded-3xl border border-slate-800 flex flex-col items-center gap-6">
            <div className="text-center">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Data Management</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest opacity-60">Backup & Restore your ledger</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 w-full">
                <button
                    onClick={handleExport}
                    className="flex-1 min-w-[140px] max-w-xs bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2 group active:scale-95"
                >
                    <svg className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-xs">Export Data</span>
                </button>

                <button
                    onClick={handleImportClick}
                    className="flex-1 min-w-[140px] max-w-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold py-3 px-6 rounded-2xl transition-all border border-blue-500/20 flex items-center justify-center gap-2 group active:scale-95"
                >
                    <svg className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs">Import Data</span>
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
            />
        </div>
    );
};

export default DataManagement;

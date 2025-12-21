
export enum DebtType {
  I_OWE = 'I_OWE',
  OWED_TO_ME = 'OWED_TO_ME'
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  color: string;
}

export type FeeFrequency = 'ONCE' | 'MONTHLY' | 'WEEKLY';
export type FeeType = 'FIXED' | 'PERCENTAGE';

export interface FeeConfig {
  enabled: boolean;
  type: FeeType;
  frequency: FeeFrequency;
  value: number;
  manualAdjustment: number; // For "Manual edit" mode
}

export interface Debt {
  id: string;
  name: string;
  description: string;
  originalAmount: number;
  amount: number; // Current remaining amount (Principal + Fees - Payments)
  type: DebtType;
  date: string;
  expectedReturnDate?: string; // New: Deadline for repayment before fees apply
  icon: string; 
  isSettled: boolean;
  history: Payment[];
  groupId?: string; 
  feeConfig?: FeeConfig;
}

export interface BalanceState {
  totalIOwe: number;
  totalOwedToMe: number;
  netBalance: number;
}

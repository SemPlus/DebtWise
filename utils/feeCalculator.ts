
import { Debt, FeeConfig } from '../types';

export const calculateAccumulatedFees = (debt: Debt): number => {
  if (!debt.feeConfig || !debt.feeConfig.enabled) return debt.feeConfig?.manualAdjustment || 0;

  const { type, frequency, value, manualAdjustment } = debt.feeConfig;
  const now = new Date();
  
  // Fees apply ONLY after the expected return date if it exists. 
  // If not, they apply from the record creation date.
  const graceEndDate = debt.expectedReturnDate ? new Date(debt.expectedReturnDate) : new Date(debt.date);
  
  // If we haven't reached the deadline yet, no automatic fees apply.
  if (now <= graceEndDate) return manualAdjustment;

  let autoFees = 0;
  // Calculate duration of the "late" period
  const diffTime = Math.abs(now.getTime() - graceEndDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (frequency === 'ONCE') {
    autoFees = type === 'FIXED' ? value : (debt.originalAmount * (value / 100));
  } else if (frequency === 'WEEKLY') {
    const weeks = Math.floor(diffDays / 7);
    const feePerWeek = type === 'FIXED' ? value : (debt.originalAmount * (value / 100));
    autoFees = weeks * feePerWeek;
  } else if (frequency === 'MONTHLY') {
    const months = (now.getFullYear() - graceEndDate.getFullYear()) * 12 + (now.getMonth() - graceEndDate.getMonth());
    const feePerMonth = type === 'FIXED' ? value : (debt.originalAmount * (value / 100));
    autoFees = Math.max(0, months) * feePerMonth;
  }

  return autoFees + manualAdjustment;
};

export const getDebtTotalWithFees = (debt: Debt): number => {
  const totalPaid = debt.history.reduce((acc, p) => acc + p.amount, 0);
  const fees = calculateAccumulatedFees(debt);
  return Math.max(0, debt.originalAmount + fees - totalPaid);
};

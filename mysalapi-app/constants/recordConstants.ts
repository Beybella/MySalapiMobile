// Shared constants for records and quick-add screens
export const EXP_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Education', 'Others'];

export const BILL_CATEGORIES = ['Housing', 'Utilities', 'Transportation', 'Food', 'Healthcare', 'Entertainment', 'Insurance', 'Education', 'Subscriptions', 'Other'];

export const PAYMENT_METHODS = ['GCash', 'Maya', 'BDO', 'BPI', 'Cash', 'Other'];

export const FUND_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  savings_account: 'Savings Account',
  cash: 'Cash on Hand',
};

// Currency formatter
export const formatCurrency = (amount: number): string =>
  `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

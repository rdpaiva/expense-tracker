export interface Expense {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
}

export interface ExpenseSummary {
  total: number;
  count: number;
  period: 'today' | 'week' | 'month';
}

export interface ParsedExpense {
  amount: number;
  merchant?: string;
  category?: string;
  description: string;
}
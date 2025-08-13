import { Expense, ExpenseSummary } from '@/types/expense';

const DB_NAME = 'ExpenseTracker';
const DB_VERSION = 1;
const STORE_NAME = 'expenses';

class ExpenseDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('date', 'date');
          store.createIndex('category', 'category');
        }
      };
    });
  }

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    if (!this.db) await this.init();

    const fullExpense: Expense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(fullExpense);

      request.onsuccess = () => resolve(fullExpense);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllExpenses(): Promise<Expense[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const expenses = request.result.map((expense: any) => ({
          ...expense,
          date: new Date(expense.date),
          createdAt: new Date(expense.createdAt),
        }));
        resolve(expenses);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    const allExpenses = await this.getAllExpenses();
    return allExpenses.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    );
  }

  async deleteExpense(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const expenseDB = new ExpenseDB();

// Helper functions for getting summary data
export async function getTodaysSummary(): Promise<ExpenseSummary> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  const expenses = await expenseDB.getExpensesByDateRange(startOfDay, endOfDay);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return { total, count: expenses.length, period: 'today' };
}

export async function getWeekSummary(): Promise<ExpenseSummary> {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59);
  
  const expenses = await expenseDB.getExpensesByDateRange(startOfWeek, endOfWeek);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return { total, count: expenses.length, period: 'week' };
}

export async function getMonthSummary(): Promise<ExpenseSummary> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  
  const expenses = await expenseDB.getExpensesByDateRange(startOfMonth, endOfMonth);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return { total, count: expenses.length, period: 'month' };
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Calendar, Tag, Store } from 'lucide-react';
import { Expense } from '@/types/expense';
import { expenseDB } from '@/lib/db';

interface ExpenseListProps {
  period: 'today' | 'week' | 'month';
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseList({ period, isOpen, onClose }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const today = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
          break;
        case 'week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
          break;
        default:
          return;
      }

      const periodExpenses = await expenseDB.getExpensesByDateRange(startDate, endDate);
      // Sort by date descending (newest first)
      periodExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
      setExpenses(periodExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
    }
  }, [isOpen, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getPeriodTitle = () => {
    switch (period) {
      case 'today':
        return "Today's Expenses";
      case 'week':
        return "This Week's Expenses";
      case 'month':
        return "This Month's Expenses";
      default:
        return 'Expenses';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: 'bg-orange-100 text-orange-800',
      transportation: 'bg-blue-100 text-blue-800',
      shopping: 'bg-purple-100 text-purple-800',
      entertainment: 'bg-pink-100 text-pink-800',
      utilities: 'bg-green-100 text-green-800',
      health: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category.toLowerCase()] || colors.other;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {getPeriodTitle()}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expenses found for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Store className="h-3 w-3" />
                          <span className="font-medium">{expense.merchant}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                              expense.category
                            )}`}
                          >
                            {expense.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(expense.date)}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-primary">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Summary at bottom */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total ({expenses.length} expense{expenses.length !== 1 ? 's' : ''})</span>
                  <span className="text-primary text-lg">
                    {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
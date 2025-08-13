'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseSummary } from '@/types/expense';
import { getTodaysSummary, getWeekSummary, getMonthSummary } from '@/lib/db';
import ExpenseList from './expense-list';

interface ExpenseSummaryProps {
  refreshTrigger: number; // Used to trigger refresh when new expense is added
}

export default function ExpenseSummaryComponent({ refreshTrigger }: ExpenseSummaryProps) {
  const [summaries, setSummaries] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | null>(null);

  const loadSummaries = async () => {
    try {
      const [today, week, month] = await Promise.all([
        getTodaysSummary(),
        getWeekSummary(),
        getMonthSummary(),
      ]);
      setSummaries([today, week, month]);
    } catch (error) {
      console.error('Error loading summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
  }, [refreshTrigger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return period;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-24 mb-2"></div>
              <div className="h-4 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
        {summaries.map((summary) => (
          <Card 
            key={summary.period} 
            className="text-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => summary.count > 0 && setSelectedPeriod(summary.period)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {getPeriodLabel(summary.period)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(summary.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.count} expense{summary.count !== 1 ? 's' : ''}
                {summary.count > 0 && (
                  <span className="ml-1 text-blue-600">• Click to view</span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <ExpenseList
        period={selectedPeriod || 'today'}
        isOpen={selectedPeriod !== null}
        onClose={() => setSelectedPeriod(null)}
      />
    </>
  );
}
'use client';

import { useState } from 'react';
import ExpenseInput from '@/components/expense-input';
import ExpenseSummaryComponent from '@/components/expense-summary';
import ReceiptPreview from '@/components/receipt-preview';
import { expenseDB } from '@/lib/db';
import { ParsedExpense } from '@/types/expense';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [receiptPreview, setReceiptPreview] = useState<{
    imageUrl: string;
    expenses: ParsedExpense[];
  } | null>(null);

  const handleExpenseSubmit = async (input: string) => {
    setIsProcessing(true);
    try {
      // Parse expense with AI
      const response = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse expense');
      }

      const parsedExpense: ParsedExpense = await response.json();

      // Save to IndexedDB
      await expenseDB.addExpense({
        amount: parsedExpense.amount,
        merchant: parsedExpense.merchant || 'Unknown',
        category: parsedExpense.category || 'other',
        description: parsedExpense.description,
        date: new Date(),
      });

      // Trigger refresh of summary
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error processing expense:', error);
      alert('Failed to process expense. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSubmit = async (imageFile: File) => {
    setIsProcessing(true);
    try {
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', imageFile);

      // Parse receipt with AI
      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse receipt');
      }

      const { expenses } = await response.json();

      // Create URL for image preview
      const imageUrl = URL.createObjectURL(imageFile);

      // Show receipt preview
      setReceiptPreview({ imageUrl, expenses });
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiptConfirm = async (expenses: ParsedExpense[]) => {
    setIsProcessing(true);
    try {
      // Add all expenses to IndexedDB
      for (const expense of expenses) {
        await expenseDB.addExpense({
          amount: expense.amount,
          merchant: expense.merchant || 'Unknown',
          category: expense.category || 'other',
          description: expense.description,
          date: new Date(),
        });
      }

      // Close preview and refresh summary
      setReceiptPreview(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving expenses:', error);
      alert('Failed to save expenses. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiptClose = () => {
    if (receiptPreview?.imageUrl) {
      URL.revokeObjectURL(receiptPreview.imageUrl);
    }
    setReceiptPreview(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            AI Expense Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Simply type or speak your expenses naturally
          </p>
        </div>

        {/* Expense Input */}
        <div className="flex justify-center">
          <ExpenseInput 
            onSubmit={handleExpenseSubmit}
            onImageSubmit={handleImageSubmit}
            isProcessing={isProcessing}
          />
        </div>

        {/* Summary Cards */}
        <ExpenseSummaryComponent refreshTrigger={refreshTrigger} />

        {/* Instructions */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-3 text-gray-900">
            How to use:
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              Type naturally: "Spent $5.25 at Starbucks" or "20 dollars for uber"
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              Press and hold the microphone button to record expenses
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              Take a photo of receipts to automatically extract multiple expenses
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              AI automatically categorizes and organizes your spending
            </li>
          </ul>
        </div>

        {/* Receipt Preview Modal */}
        <ReceiptPreview
          imageUrl={receiptPreview?.imageUrl || ''}
          expenses={receiptPreview?.expenses || []}
          isOpen={receiptPreview !== null}
          onClose={handleReceiptClose}
          onConfirm={handleReceiptConfirm}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}
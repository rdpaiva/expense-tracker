'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Check, Edit3, Trash2 } from 'lucide-react';
import { ParsedExpense } from '@/types/expense';
import { Input } from '@/components/ui/input';

interface ReceiptPreviewProps {
  imageUrl: string;
  expenses: ParsedExpense[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (expenses: ParsedExpense[]) => void;
  isProcessing: boolean;
}

export default function ReceiptPreview({
  imageUrl,
  expenses,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: ReceiptPreviewProps) {
  const [editableExpenses, setEditableExpenses] = useState<ParsedExpense[]>(expenses);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleEdit = (index: number, field: keyof ParsedExpense, value: string | number) => {
    const updated = [...editableExpenses];
    if (field === 'amount') {
      updated[index] = { ...updated[index], [field]: parseFloat(value as string) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setEditableExpenses(updated);
  };

  const handleRemove = (index: number) => {
    const updated = editableExpenses.filter((_, i) => i !== index);
    setEditableExpenses(updated);
  };

  const handleConfirm = () => {
    // Filter out any expenses with invalid amounts
    const validExpenses = editableExpenses.filter(exp => exp.amount > 0);
    onConfirm(validExpenses);
  };

  const getTotalAmount = () => {
    return editableExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            Review Receipt ({editableExpenses.length} item{editableExpenses.length !== 1 ? 's' : ''})
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receipt Image */}
            <div className="space-y-4">
              <h3 className="font-medium">Receipt Image</h3>
              <img
                src={imageUrl}
                alt="Receipt"
                className="w-full max-w-sm mx-auto rounded-lg border shadow-sm"
              />
            </div>

            {/* Extracted Expenses */}
            <div className="space-y-4">
              <h3 className="font-medium">Extracted Expenses</h3>
              {editableExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No expenses could be extracted from this receipt.</p>
                  <p className="text-sm mt-2">The image might be unclear or not a receipt.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editableExpenses.map((expense, index) => (
                    <div
                      key={index}
                      className="bg-muted/30 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          {editingIndex === index ? (
                            <>
                              <Input
                                value={expense.description}
                                onChange={(e) => handleEdit(index, 'description', e.target.value)}
                                placeholder="Description"
                                className="text-sm"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={expense.amount}
                                  onChange={(e) => handleEdit(index, 'amount', e.target.value)}
                                  type="number"
                                  step="0.01"
                                  placeholder="Amount"
                                  className="text-sm"
                                />
                                <Input
                                  value={expense.category || ''}
                                  onChange={(e) => handleEdit(index, 'category', e.target.value)}
                                  placeholder="Category"
                                  className="text-sm"
                                />
                              </div>
                              <Input
                                value={expense.merchant || ''}
                                onChange={(e) => handleEdit(index, 'merchant', e.target.value)}
                                placeholder="Merchant"
                                className="text-sm"
                              />
                            </>
                          ) : (
                            <>
                              <p className="font-medium">{expense.description}</p>
                              <div className="text-sm text-muted-foreground">
                                <p>Amount: {formatCurrency(expense.amount)}</p>
                                <p>Category: {expense.category}</p>
                                <p>Merchant: {expense.merchant}</p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total and Actions */}
              {editableExpenses.length > 0 && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(getTotalAmount())}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      className="flex-1"
                      disabled={isProcessing || editableExpenses.length === 0}
                    >
                      {isProcessing ? (
                        'Adding...'
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Add {editableExpenses.length} Expense{editableExpenses.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
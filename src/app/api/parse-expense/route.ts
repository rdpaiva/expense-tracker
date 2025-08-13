import { NextRequest, NextResponse } from 'next/server';
import { parseExpenseWithAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input provided' },
        { status: 400 }
      );
    }

    const parsedExpense = await parseExpenseWithAI(input);
    
    return NextResponse.json(parsedExpense);
  } catch (error) {
    console.error('Error parsing expense:', error);
    return NextResponse.json(
      { error: 'Failed to parse expense' },
      { status: 500 }
    );
  }
}
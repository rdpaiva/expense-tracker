import OpenAI from 'openai';
import { ParsedExpense } from '@/types/expense';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI assistant that parses expense descriptions into structured data. 
Extract the following information from expense text:
- amount: The monetary amount (as a number)
- merchant: The store/business name (or "Unknown" if not specified)
- category: The expense category (food, transportation, shopping, entertainment, etc.)
- description: A clean description of the expense

Respond ONLY with valid JSON in this format:
{
  "amount": 5.25,
  "merchant": "Starbucks",
  "category": "food",
  "description": "Coffee at Starbucks"
}`;

export async function parseReceiptImage(imageBase64: string): Promise<ParsedExpense[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes receipt images and extracts expense data.
          
          Extract ALL expenses from this receipt image. For each item, provide:
          - amount: The monetary amount (as a number)
          - merchant: The store/business name from the receipt
          - category: The expense category (food, transportation, shopping, entertainment, etc.)
          - description: A clear description of the item/service
          
          Respond ONLY with valid JSON array format:
          [
            {
              "amount": 5.25,
              "merchant": "Starbucks",
              "category": "food",
              "description": "Coffee - Grande Latte"
            },
            {
              "amount": 2.75,
              "merchant": "Starbucks", 
              "category": "food",
              "description": "Pastry - Blueberry Muffin"
            }
          ]
          
          If you cannot read the receipt clearly, return an empty array: []`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as ParsedExpense[];
    
    // Validate the parsed data
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid response format - expected array');
    }

    return parsed.filter(expense => 
      expense.amount && 
      typeof expense.amount === 'number' && 
      expense.amount > 0
    );
  } catch (error) {
    console.error('Error parsing receipt with AI:', error);
    return [];
  }
}

export async function parseExpenseWithAI(input: string): Promise<ParsedExpense> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input }
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as ParsedExpense;
    
    // Validate the parsed data
    if (!parsed.amount || typeof parsed.amount !== 'number') {
      throw new Error('Invalid amount in parsed data');
    }

    return {
      amount: parsed.amount,
      merchant: parsed.merchant || 'Unknown',
      category: parsed.category || 'other',
      description: parsed.description || input,
    };
  } catch (error) {
    console.error('Error parsing expense with AI:', error);
    
    // Fallback: try to extract amount with regex
    const amountMatch = input.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    return {
      amount,
      merchant: 'Unknown',
      category: 'other',
      description: input,
    };
  }
}
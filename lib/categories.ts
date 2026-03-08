import type { CategoryDef } from './types'

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: 'rent', label: 'Rent', icon: '🏠', color: '#ef4444', type: 'expense' },
  { id: 'food', label: 'Food & Groceries', icon: '🛒', color: '#f97316', type: 'expense' },
  { id: 'dining', label: 'Dining Out', icon: '🍽️', color: '#fb923c', type: 'expense' },
  { id: 'transport', label: 'Transport', icon: '🚗', color: '#eab308', type: 'expense' },
  { id: 'utilities', label: 'Utilities', icon: '💡', color: '#84cc16', type: 'expense' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📱', color: '#06b6d4', type: 'expense' },
  { id: 'fashion', label: 'Fashion', icon: '👕', color: '#8b5cf6', type: 'expense' },
  { id: 'health', label: 'Health', icon: '🏥', color: '#ec4899', type: 'expense' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#f43f5e', type: 'expense' },
  { id: 'education', label: 'Education', icon: '📚', color: '#3b82f6', type: 'expense' },
  { id: 'gifts', label: 'Gifts', icon: '🎁', color: '#d946ef', type: 'expense' },
  { id: 'travel', label: 'Travel', icon: '✈️', color: '#14b8a6', type: 'expense' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️', color: '#64748b', type: 'expense' },
  { id: 'personal', label: 'Personal Care', icon: '💆', color: '#a78bfa', type: 'expense' },
  { id: 'other_expense', label: 'Other', icon: '📦', color: '#94a3b8', type: 'expense' },
]

export const INCOME_CATEGORIES: CategoryDef[] = [
  { id: 'salary', label: 'Salary', icon: '💰', color: '#22c55e', type: 'income' },
  { id: 'freelance', label: 'Freelance', icon: '💻', color: '#10b981', type: 'income' },
  { id: 'investment', label: 'Investment', icon: '📈', color: '#059669', type: 'income' },
  { id: 'refund', label: 'Refund', icon: '↩️', color: '#34d399', type: 'income' },
  { id: 'other_income', label: 'Other', icon: '💵', color: '#6ee7b7', type: 'income' },
]

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

export function getCategoryById(id: string): CategoryDef | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id)
}

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'max', label: 'Max', icon: '💳' },
  { id: 'payfor', label: 'Payfor', icon: '💳' },
  { id: 'bit', label: 'Bit', icon: '📲' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'other', label: 'Other', icon: '🔄' },
] as const

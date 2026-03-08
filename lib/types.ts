export type TransactionType = 'expense' | 'income'
export type PaymentMethod = 'cash' | 'max' | 'payfor' | 'bit' | 'bank_transfer' | 'other'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  date: string
  note: string
  payment_method: PaymentMethod
  is_recurring: boolean
  recurring_day: number | null
  created_at: string
}

export interface Budget {
  id: string
  category: string
  monthly_limit: number
  month: string
  created_at: string
}

export interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  color: string
  icon: string
  created_at: string
}

export interface CategoryDef {
  id: string
  label: string
  icon: string
  color: string
  type: TransactionType
}

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>
      }
      budgets: {
        Row: Budget
        Insert: Omit<Budget, 'id' | 'created_at'>
        Update: Partial<Omit<Budget, 'id' | 'created_at'>>
      }
      savings_goals: {
        Row: SavingsGoal
        Insert: Omit<SavingsGoal, 'id' | 'created_at'>
        Update: Partial<Omit<SavingsGoal, 'id' | 'created_at'>>
      }
    }
  }
}

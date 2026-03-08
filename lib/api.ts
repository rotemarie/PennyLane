import { supabase } from './supabase'
import type { Transaction, Budget, SavingsGoal } from './types'
import { getMonthRange } from './utils'

// ── Transactions ──

export async function getTransactions(month: string): Promise<Transaction[]> {
  const { start, end } = getMonthRange(month)
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getRecurringTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('is_recurring', true)
    .order('recurring_day', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('transactions').insert(tx).select().single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

// ── Budgets ──

export async function getBudgets(month: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', month)
  if (error) throw error
  return data ?? []
}

export async function setBudget(category: string, month: string, monthlyLimit: number) {
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('category', category)
    .eq('month', month)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('budgets')
      .update({ monthly_limit: monthlyLimit })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('budgets')
      .insert({ category, month, monthly_limit: monthlyLimit })
    if (error) throw error
  }
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}

export async function copyBudgetsToMonth(fromMonth: string, toMonth: string) {
  const { data: existing } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', fromMonth)
  if (!existing || existing.length === 0) return

  const { data: alreadyExist } = await supabase
    .from('budgets')
    .select('category')
    .eq('month', toMonth)
  const existingCats = new Set((alreadyExist ?? []).map((b) => b.category))

  const toInsert = existing
    .filter((b) => !existingCats.has(b.category))
    .map((b) => ({ category: b.category, monthly_limit: b.monthly_limit, month: toMonth }))

  if (toInsert.length > 0) {
    const { error } = await supabase.from('budgets').insert(toInsert)
    if (error) throw error
  }
}

// ── Savings Goals ──

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('savings_goals').insert(goal).select().single()
  if (error) throw error
  return data
}

export async function updateSavingsGoal(id: string, changes: Partial<SavingsGoal>) {
  const { error } = await supabase.from('savings_goals').update(changes).eq('id', id)
  if (error) throw error
}

export async function deleteSavingsGoal(id: string) {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id)
  if (error) throw error
}

export async function contributeToGoal(id: string, amount: number) {
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('current_amount')
    .eq('id', id)
    .single()
  if (!goal) return
  const { error } = await supabase
    .from('savings_goals')
    .update({ current_amount: goal.current_amount + amount })
    .eq('id', id)
  if (error) throw error
}

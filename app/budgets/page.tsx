'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBudgets, getTransactions, setBudget, deleteBudget, copyBudgetsToMonth } from '@/lib/api'
import { monthKey, formatCurrency, percentOf } from '@/lib/utils'
import { EXPENSE_CATEGORIES, getCategoryById } from '@/lib/categories'
import type { Budget, Transaction } from '@/lib/types'
import { AlertTriangle, Plus, Trash2, Copy, X, Wallet } from 'lucide-react'
import MonthPicker from '@/components/MonthPicker'
import { format, subMonths, parse } from 'date-fns'

export default function BudgetsPage() {
  const [month, setMonth] = useState(monthKey())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [txns, setTxns] = useState<Transaction[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [b, t] = await Promise.all([getBudgets(month), getTransactions(month)])
      setBudgets(b)
      setTxns(t)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  const expenseByCategory: Record<string, number> = {}
  txns.filter((t) => t.type === 'expense').forEach((t) => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
  })

  const totalBudget = budgets.reduce((s, b) => s + b.monthly_limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + (expenseByCategory[b.category] || 0), 0)
  const prevMonth = format(subMonths(parse(month + '-01', 'yyyy-MM-dd', new Date()), 1), 'yyyy-MM')

  async function handleDelete(id: string) {
    await deleteBudget(id)
    load()
  }

  async function handleCopy() {
    await copyBudgetsToMonth(prevMonth, month)
    load()
  }

  if (loading) return <div className="text-center py-20 text-slate-500">Loading...</div>

  return (
    <div className="space-y-5">
      <MonthPicker value={month} onChange={setMonth} />

      {budgets.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Overall Budget</p>
            <span className="text-sm text-slate-400">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
          </div>
          <ProgressBar spent={totalSpent} limit={totalBudget} />
        </div>
      )}

      <div className="space-y-3">
        {budgets.map((b) => {
          const spent = expenseByCategory[b.category] || 0
          const pct = percentOf(spent, b.monthly_limit)
          const cat = getCategoryById(b.category)
          return (
            <div key={b.id} className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: (cat?.color || '#64748b') + '20' }}>
                  {cat?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{cat?.label || b.category}</span>
                    <button onClick={() => handleDelete(b.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{formatCurrency(spent)} of {formatCurrency(b.monthly_limit)}</span>
                    <span className={pct >= 100 ? 'text-red-400 font-medium' : pct >= 80 ? 'text-amber-400 font-medium' : ''}>{pct}%</span>
                  </div>
                </div>
              </div>
              <ProgressBar spent={spent} limit={b.monthly_limit} />
              {pct >= 80 && pct < 100 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                  <AlertTriangle size={12} /> Approaching limit
                </div>
              )}
              {pct >= 100 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                  <AlertTriangle size={12} /> Over budget by {formatCurrency(spent - b.monthly_limit)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {budgets.length === 0 && !showAdd && (
        <div className="text-center py-12 text-slate-500">
          <Wallet size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No budgets set</p>
          <p className="text-sm mb-4">Set category spending limits</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16} className="inline mr-1" /> Add Budget</button>
            <button onClick={handleCopy} className="btn-ghost"><Copy size={14} className="inline mr-1" /> Copy from last month</button>
          </div>
        </div>
      )}

      {showAdd && (
        <AddBudgetForm
          month={month}
          existingCategories={budgets.map((b) => b.category)}
          onClose={() => { setShowAdd(false); load() }}
        />
      )}

      {budgets.length > 0 && !showAdd && (
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Plus size={16} /> Add Budget
          </button>
          <button onClick={handleCopy} className="btn-ghost flex items-center gap-1">
            <Copy size={14} /> Copy prev
          </button>
        </div>
      )}
    </div>
  )
}

function ProgressBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = Math.min((spent / limit) * 100, 100)
  const over = spent > limit
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function AddBudgetForm({ month, existingCategories, onClose }: { month: string; existingCategories: string[]; onClose: () => void }) {
  const [category, setCategory] = useState('')
  const [limit, setLimit] = useState('')
  const available = EXPENSE_CATEGORIES.filter((c) => !existingCategories.includes(c.id))

  async function handleAdd() {
    if (!category || !limit) return
    await setBudget(category, month, parseFloat(limit))
    onClose()
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">New Budget</p>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200"><X size={18} /></button>
      </div>
      <div>
        <label className="section-title">Category</label>
        <div className="flex flex-wrap gap-2">
          {available.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.id)} className={`chip ${category === cat.id ? 'chip-active' : 'chip-inactive'}`}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="section-title">Monthly Limit</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
          <input type="number" min="0" step="10" placeholder="500" value={limit} onChange={(e) => setLimit(e.target.value)} className="pl-8" />
        </div>
      </div>
      <button onClick={handleAdd} disabled={!category || !limit} className="btn-primary w-full">Set Budget</button>
    </div>
  )
}

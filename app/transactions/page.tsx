'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parse } from 'date-fns'
import { getCategoryById, PAYMENT_METHODS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/categories'
import { formatCurrency, monthKey, todayISO } from '@/lib/utils'
import { getTransactions, deleteTransaction, updateTransaction } from '@/lib/api'
import type { Transaction, TransactionType, PaymentMethod } from '@/lib/types'
import { Trash2, Repeat, Filter, Pencil, X, Check, ChevronDown } from 'lucide-react'
import MonthPicker from '@/components/MonthPicker'

export default function TransactionsPage() {
  const [month, setMonth] = useState(monthKey())
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTxns(await getTransactions(month))
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  const filtered = txns
    .filter((t) => filterType === 'all' || t.type === filterType)
    .filter((t) => !filterCategory || t.category === filterCategory)
    .sort((a, b) => b.date.localeCompare(a.date))

  const grouped: Record<string, Transaction[]> = {}
  filtered.forEach((t) => {
    if (!grouped[t.date]) grouped[t.date] = []
    grouped[t.date].push(t)
  })

  const usedCategories = [...new Set(txns.map((t) => t.category))]

  async function handleDelete(id: string) {
    await deleteTransaction(id)
    setTxns((prev) => prev.filter((t) => t.id !== id))
    setEditingId(null)
  }

  async function handleUpdate(id: string, changes: Partial<Transaction>) {
    await updateTransaction(id, changes)
    await load()
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <MonthPicker value={month} onChange={setMonth} />

      <div className="flex gap-2 flex-wrap">
        {(['all', 'expense', 'income'] as const).map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={`chip ${filterType === t ? 'chip-active' : 'chip-inactive'}`}>
            {t === 'all' ? 'All' : t === 'expense' ? '↓ Expenses' : '↑ Income'}
          </button>
        ))}
        <button
          onClick={() => setShowCategoryFilter(!showCategoryFilter)}
          className={`chip ${filterCategory ? 'chip-active' : 'chip-inactive'} flex items-center gap-1`}
        >
          <Filter size={12} />
          {filterCategory ? getCategoryById(filterCategory)?.label : 'Category'}
          <ChevronDown size={12} />
        </button>
      </div>

      {showCategoryFilter && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilterCategory(null); setShowCategoryFilter(false) }}
            className={`chip ${!filterCategory ? 'chip-active' : 'chip-inactive'}`}
          >
            All categories
          </button>
          {usedCategories.map((catId) => {
            const cat = getCategoryById(catId)
            return (
              <button
                key={catId}
                onClick={() => { setFilterCategory(catId); setShowCategoryFilter(false) }}
                className={`chip ${filterCategory === catId ? 'chip-active' : 'chip-inactive'}`}
              >
                {cat?.icon} {cat?.label || catId}
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Filter size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No transactions</p>
          <p className="text-sm">Tap + to add your first entry</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dateStr, dayTxns]) => (
          <div key={dateStr}>
            <p className="section-title mt-4">
              {format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d')}
            </p>
            <div className="space-y-2">
              {dayTxns.map((tx) =>
                editingId === tx.id ? (
                  <EditRow key={tx.id} tx={tx} onSave={handleUpdate} onCancel={() => setEditingId(null)} onDelete={handleDelete} />
                ) : (
                  <TxRow key={tx.id} tx={tx} onEdit={() => setEditingId(tx.id)} onDelete={handleDelete} />
                )
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function TxRow({ tx, onEdit, onDelete }: { tx: Transaction; onEdit: () => void; onDelete: (id: string) => void }) {
  const cat = getCategoryById(tx.category)
  const pm = PAYMENT_METHODS.find((p) => p.id === tx.payment_method)

  return (
    <div className="card flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: (cat?.color || '#64748b') + '20' }}
      >
        {cat?.icon || '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium truncate">{cat?.label || tx.category}</span>
          {tx.is_recurring && <Repeat size={12} className="text-blue-400 flex-shrink-0" />}
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          {pm && <span>{pm.icon}</span>}
          {tx.note && <span className="truncate">{tx.note}</span>}
        </div>
      </div>
      <span className={`font-semibold tabular-nums flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(tx.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function EditRow({ tx, onSave, onCancel, onDelete }: {
  tx: Transaction
  onSave: (id: string, changes: Partial<Transaction>) => void
  onCancel: () => void
  onDelete: (id: string) => void
}) {
  const [amount, setAmount] = useState(String(tx.amount))
  const [category, setCategory] = useState(tx.category)
  const [date, setDate] = useState(tx.date)
  const [note, setNote] = useState(tx.note)
  const [paymentMethod, setPaymentMethod] = useState(tx.payment_method)
  const [type, setType] = useState<TransactionType>(tx.type)

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  function handleSave() {
    onSave(tx.id, {
      type,
      amount: parseFloat(amount),
      category,
      date,
      note,
      payment_method: paymentMethod,
    })
  }

  return (
    <div className="card space-y-3 ring-1 ring-blue-500/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-blue-400">Editing</span>
        <div className="flex gap-1">
          <button onClick={handleSave} className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg">
            <Check size={16} />
          </button>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-lg">
            <X size={16} />
          </button>
          <button onClick={() => onDelete(tx.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button key={t} onClick={() => { setType(t); setCategory('') }}
            className={`chip flex-1 justify-center ${type === t ? (t === 'expense' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'chip-active') : 'chip-inactive'}`}>
            {t === 'expense' ? '↓ Expense' : '↑ Income'}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₪</span>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-7 py-2 text-sm" />
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="py-2 text-sm flex-1" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`chip text-xs ${category === cat.id ? 'chip-active' : 'chip-inactive'}`}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PAYMENT_METHODS.map((pm) => (
          <button key={pm.id} onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
            className={`chip text-xs ${paymentMethod === pm.id ? 'chip-active' : 'chip-inactive'}`}>
            {pm.icon} {pm.label}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} className="py-2 text-sm" />
    </div>
  )
}

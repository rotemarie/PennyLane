'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parse } from 'date-fns'
import { getCategoryById, PAYMENT_METHODS } from '@/lib/categories'
import { formatCurrency, monthKey } from '@/lib/utils'
import { getTransactions, deleteTransaction } from '@/lib/api'
import type { Transaction } from '@/lib/types'
import { Trash2, Repeat, Filter } from 'lucide-react'
import MonthPicker from '@/components/MonthPicker'

export default function TransactionsPage() {
  const [month, setMonth] = useState(monthKey())
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all')
  const [txns, setTxns] = useState<Transaction[]>([])
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
    .sort((a, b) => b.date.localeCompare(a.date))

  const grouped: Record<string, Transaction[]> = {}
  filtered.forEach((t) => {
    if (!grouped[t.date]) grouped[t.date] = []
    grouped[t.date].push(t)
  })

  async function handleDelete(id: string) {
    await deleteTransaction(id)
    setTxns((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-4">
      <MonthPicker value={month} onChange={setMonth} />

      <div className="flex gap-2">
        {(['all', 'expense', 'income'] as const).map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={`chip ${filterType === t ? 'chip-active' : 'chip-inactive'}`}>
            {t === 'all' ? 'All' : t === 'expense' ? '↓ Expenses' : '↑ Income'}
          </button>
        ))}
      </div>

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
              {dayTxns.map((tx) => (
                <TxRow key={tx.id} tx={tx} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function TxRow({ tx, onDelete }: { tx: Transaction; onDelete: (id: string) => void }) {
  const [showDelete, setShowDelete] = useState(false)
  const cat = getCategoryById(tx.category)
  const pm = PAYMENT_METHODS.find((p) => p.id === tx.payment_method)

  return (
    <div
      className="card flex items-center gap-3 active:bg-slate-800 transition-colors cursor-pointer"
      onClick={() => setShowDelete(!showDelete)}
    >
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
      <div className="text-right flex-shrink-0">
        {showDelete ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(tx.id) }}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        ) : (
          <span className={`font-semibold tabular-nums ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
          </span>
        )}
      </div>
    </div>
  )
}

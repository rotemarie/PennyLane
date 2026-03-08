'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/lib/categories'
import { todayISO } from '@/lib/utils'
import { addTransaction } from '@/lib/api'
import type { TransactionType, PaymentMethod } from '@/lib/types'
import { ArrowDownCircle, ArrowUpCircle, Repeat } from 'lucide-react'

export default function AddPage() {
  const router = useRouter()
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('max')
  const [isRecurring, setIsRecurring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !category || saving) return
    setSaving(true)
    setError('')
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        date,
        note,
        payment_method: paymentMethod,
        is_recurring: isRecurring,
        recurring_day: isRecurring ? new Date(date).getDate() : null,
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Failed to save. Check your Supabase connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
            type === 'expense' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <ArrowDownCircle size={18} /> Expense
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategory('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
            type === 'income' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <ArrowUpCircle size={18} /> Income
        </button>
      </div>

      <div>
        <label className="section-title">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₪</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 text-2xl font-bold"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="section-title">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`chip ${category === cat.id ? 'chip-active' : 'chip-inactive'}`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="section-title">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div>
        <label className="section-title">Payment Method</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
              className={`chip ${paymentMethod === pm.id ? 'chip-active' : 'chip-inactive'}`}
            >
              <span>{pm.icon}</span> {pm.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="section-title">Note (optional)</label>
        <input
          type="text"
          placeholder="What was this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={() => setIsRecurring(!isRecurring)}
        className={`flex items-center gap-2 w-full py-3 px-4 rounded-xl transition-colors ${
          isRecurring ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-slate-800 text-slate-400'
        }`}
      >
        <Repeat size={16} />
        <span className="font-medium">Recurring monthly</span>
      </button>

      {error && (
        <div className="bg-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 border border-red-500/30">
          {error}
        </div>
      )}

      <button type="submit" disabled={!amount || !category || saving} className="btn-primary w-full text-lg">
        {saving ? 'Saving...' : type === 'expense' ? 'Add Expense' : 'Add Income'}
      </button>
    </form>
  )
}

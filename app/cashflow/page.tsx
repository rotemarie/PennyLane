'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
  BarChart, Bar,
} from 'recharts'
import { getTransactions, getRecurringTransactions } from '@/lib/api'
import { monthKey, formatCurrency, getDaysInMonth, shortMonthLabel, getPreviousMonths } from '@/lib/utils'
import { getCategoryById, EXPENSE_CATEGORIES } from '@/lib/categories'
import { format, isBefore } from 'date-fns'
import { CalendarClock, Repeat, TrendingUp, Filter, X } from 'lucide-react'
import MonthPicker from '@/components/MonthPicker'
import type { Transaction } from '@/lib/types'

export default function CashFlowPage() {
  const [month, setMonth] = useState(monthKey())
  const [txns, setTxns] = useState<Transaction[]>([])
  const [recurring, setRecurring] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [trendData, setTrendData] = useState<{ month: string; amount: number }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, r] = await Promise.all([getTransactions(month), getRecurringTransactions()])
      setTxns(t)
      setRecurring(r)

      if (selectedCategory) {
        const months = getPreviousMonths(6)
        const allData = await Promise.all(months.map((m) => getTransactions(m)))
        setTrendData(months.map((mk, i) => ({
          month: shortMonthLabel(mk),
          amount: allData[i]
            .filter((tx) => tx.type === 'expense' && tx.category === selectedCategory)
            .reduce((s, tx) => s + tx.amount, 0),
        })))
      }
    } finally {
      setLoading(false)
    }
  }, [month, selectedCategory])

  useEffect(() => { load() }, [load])

  const days = getDaysInMonth(month)
  const today = new Date()

  const filteredTxns = selectedCategory
    ? txns.filter((t) => t.category === selectedCategory)
    : txns

  const categoryTotal = selectedCategory
    ? filteredTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    : 0

  const cumulativeData = useMemo(() => {
    let runningTotal = 0
    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayTxns = filteredTxns.filter((t) => t.date === dateStr)
      const dayIncome = dayTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const dayExpense = dayTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      runningTotal += dayIncome - dayExpense
      const isPast = isBefore(day, today) || format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      return { day: format(day, 'd'), net: isPast ? runningTotal : null, projected: runningTotal }
    })
  }, [filteredTxns, days, today])

  const upcomingRecurring = useMemo(() => {
    const todayDay = today.getDate()
    const items = selectedCategory
      ? recurring.filter((r) => r.category === selectedCategory)
      : recurring
    return items
      .filter((r) => r.recurring_day && r.recurring_day >= todayDay)
      .sort((a, b) => (a.recurring_day || 0) - (b.recurring_day || 0))
  }, [recurring, today, selectedCategory])

  const totalRecurringExpenses = recurring.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const totalRecurringIncome = recurring.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)

  const totalSpentSoFar = filteredTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const daysElapsed = Math.min(today.getDate(), days.length)
  const dailyAvg = daysElapsed > 0 ? totalSpentSoFar / daysElapsed : 0
  const projectedMonthly = dailyAvg * days.length

  const usedCategories = [...new Set(txns.filter((t) => t.type === 'expense').map((t) => t.category))]
  const selectedCatDef = selectedCategory ? getCategoryById(selectedCategory) : null

  if (loading) return <div className="text-center py-20 text-slate-500">Loading...</div>

  return (
    <div className="space-y-5">
      <MonthPicker value={month} onChange={setMonth} />

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowCategoryPicker(!showCategoryPicker)}
          className={`chip flex items-center gap-1 ${selectedCategory ? 'chip-active' : 'chip-inactive'}`}
        >
          <Filter size={12} />
          {selectedCatDef ? `${selectedCatDef.icon} ${selectedCatDef.label}` : 'All categories'}
        </button>
        {selectedCategory && (
          <button onClick={() => { setSelectedCategory(null); setShowCategoryPicker(false) }}
            className="chip chip-inactive flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {showCategoryPicker && (
        <div className="card">
          <p className="section-title">Filter by Category</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setSelectedCategory(null); setShowCategoryPicker(false) }}
              className={`chip ${!selectedCategory ? 'chip-active' : 'chip-inactive'}`}>
              All
            </button>
            {usedCategories.map((catId) => {
              const cat = getCategoryById(catId)
              return (
                <button key={catId} onClick={() => { setSelectedCategory(catId); setShowCategoryPicker(false) }}
                  className={`chip ${selectedCategory === catId ? 'chip-active' : 'chip-inactive'}`}>
                  {cat?.icon} {cat?.label}
                </button>
              )
            })}
            {usedCategories.length === 0 && (
              <p className="text-sm text-slate-500">No expense categories used this month</p>
            )}
          </div>
        </div>
      )}

      {/* Category Summary */}
      {selectedCategory && (
        <div className="card" style={{ borderColor: selectedCatDef?.color + '40' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{selectedCatDef?.icon}</span>
            <span className="font-semibold">{selectedCatDef?.label}</span>
          </div>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(categoryTotal)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {filteredTxns.filter((t) => t.type === 'expense').length} transactions this month
          </p>
        </div>
      )}

      {/* Cash Flow Chart */}
      <div className="card">
        <p className="section-title">
          {selectedCategory ? `${selectedCatDef?.label} Cash Flow` : 'Cumulative Cash Flow'}
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval={Math.floor(days.length / 7)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `₪${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="net" stroke={selectedCatDef?.color || '#22c55e'} strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="projected" stroke={selectedCatDef?.color || '#22c55e'} strokeWidth={1} strokeDasharray="4 4" dot={false} opacity={0.3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Trend Over Time */}
      {selectedCategory && trendData.length > 0 && (
        <div className="card">
          <p className="section-title">{selectedCatDef?.label} – 6-Month Trend</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `₪${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill={selectedCatDef?.color || '#22c55e'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-400 mb-1">
            <TrendingUp size={14} /> Daily Average
          </div>
          <p className="text-lg font-bold">{formatCurrency(dailyAvg)}<span className="text-xs text-slate-500 font-normal">/day</span></p>
        </div>
        <div className="card">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-1">
            <TrendingUp size={14} /> Projected Total
          </div>
          <p className="text-lg font-bold">{formatCurrency(projectedMonthly)}</p>
        </div>
      </div>

      {/* Recurring */}
      {!selectedCategory && recurring.length > 0 ? (
        <div className="card">
          <p className="section-title">Recurring Summary</p>
          <div className="flex gap-4 mb-4 text-sm">
            <div><span className="text-slate-500">Fixed income:</span>{' '}<span className="text-emerald-400 font-medium">{formatCurrency(totalRecurringIncome)}</span></div>
            <div><span className="text-slate-500">Fixed costs:</span>{' '}<span className="text-red-400 font-medium">{formatCurrency(totalRecurringExpenses)}</span></div>
          </div>
          {upcomingRecurring.length > 0 && (
            <>
              <p className="section-title">Upcoming This Month</p>
              <div className="space-y-2">
                {upcomingRecurring.map((r) => {
                  const cat = getCategoryById(r.category)
                  return (
                    <div key={r.id} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 w-16">
                        <CalendarClock size={12} /> Day {r.recurring_day}
                      </div>
                      <span className="text-sm">{cat?.icon} {cat?.label}</span>
                      <span className={`ml-auto text-sm font-medium tabular-nums ${r.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      ) : !selectedCategory ? (
        <div className="card text-center py-8 text-slate-500">
          <Repeat size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Mark transactions as recurring to track fixed costs here</p>
        </div>
      ) : null}
    </div>
  )
}

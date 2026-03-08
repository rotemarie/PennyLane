'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { getTransactions, getRecurringTransactions } from '@/lib/api'
import { monthKey, formatCurrency, getDaysInMonth } from '@/lib/utils'
import { getCategoryById } from '@/lib/categories'
import { format, isBefore } from 'date-fns'
import { CalendarClock, Repeat, TrendingUp } from 'lucide-react'
import MonthPicker from '@/components/MonthPicker'
import type { Transaction } from '@/lib/types'

export default function CashFlowPage() {
  const [month, setMonth] = useState(monthKey())
  const [txns, setTxns] = useState<Transaction[]>([])
  const [recurring, setRecurring] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, r] = await Promise.all([getTransactions(month), getRecurringTransactions()])
      setTxns(t)
      setRecurring(r)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  const days = getDaysInMonth(month)
  const today = new Date()

  const cumulativeData = useMemo(() => {
    let runningTotal = 0
    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayTxns = txns.filter((t) => t.date === dateStr)
      const dayIncome = dayTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const dayExpense = dayTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      runningTotal += dayIncome - dayExpense
      const isPast = isBefore(day, today) || format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      return { day: format(day, 'd'), net: isPast ? runningTotal : null, projected: runningTotal }
    })
  }, [txns, days, today])

  const upcomingRecurring = useMemo(() => {
    const todayDay = today.getDate()
    return recurring
      .filter((r) => r.recurring_day && r.recurring_day >= todayDay)
      .sort((a, b) => (a.recurring_day || 0) - (b.recurring_day || 0))
  }, [recurring, today])

  const totalRecurringExpenses = recurring.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const totalRecurringIncome = recurring.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)

  const totalSpentSoFar = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const daysElapsed = Math.min(today.getDate(), days.length)
  const dailyAvg = daysElapsed > 0 ? totalSpentSoFar / daysElapsed : 0
  const projectedMonthly = dailyAvg * days.length

  if (loading) return <div className="text-center py-20 text-slate-500">Loading...</div>

  return (
    <div className="space-y-5">
      <MonthPicker value={month} onChange={setMonth} />

      <div className="card">
        <p className="section-title">Cumulative Cash Flow</p>
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
              <Line type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="projected" stroke="#22c55e" strokeWidth={1} strokeDasharray="4 4" dot={false} opacity={0.3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

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

      {recurring.length > 0 ? (
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
      ) : (
        <div className="card text-center py-8 text-slate-500">
          <Repeat size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Mark transactions as recurring to track fixed costs here</p>
        </div>
      )}
    </div>
  )
}

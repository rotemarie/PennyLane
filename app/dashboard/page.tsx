'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { ArrowUpCircle, ArrowDownCircle, PiggyBank, Wallet, TrendingUp } from 'lucide-react'
import MonthPicker from '@/components/MonthPicker'
import { getTransactions } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { formatCurrency, monthKey, shortMonthLabel, getPreviousMonths } from '@/lib/utils'
import { getCategoryById } from '@/lib/categories'
import type { Transaction } from '@/lib/types'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [month, setMonth] = useState(monthKey())
  const [txns, setTxns] = useState<Transaction[]>([])
  const [barData, setBarData] = useState<{ month: string; income: number; expenses: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState('')
  const router = useRouter()

  const load = useCallback(async () => {
    setLoading(true)
    setDbError('')
    try {
      const { data: testData, error: testError } = await supabase.from('transactions').select('id').limit(1)
      if (testError) {
        setDbError(`Supabase error: ${testError.message} (code: ${testError.code})`)
        setLoading(false)
        return
      }

      const data = await getTransactions(month)
      setTxns(data)

      const months = getPreviousMonths(6)
      const allData = await Promise.all(months.map((m) => getTransactions(m)))
      setBarData(
        months.map((mk, i) => ({
          month: shortMonthLabel(mk),
          income: allData[i].filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expenses: allData[i].filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        }))
      )
    } catch (err: any) {
      setDbError(`Connection failed: ${err?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savings = income - expenses

  const catBreakdown: Record<string, number> = {}
  txns.filter((t) => t.type === 'expense').forEach((t) => {
    catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount
  })

  const pieData = Object.entries(catBreakdown)
    .map(([catId, total]) => {
      const cat = getCategoryById(catId)
      return { name: cat?.label || catId, value: total, color: cat?.color || '#64748b', icon: cat?.icon || '📦' }
    })
    .sort((a, b) => b.value - a.value)

  const hasBarData = barData.some((d) => d.income > 0 || d.expenses > 0)

  return (
    <div className="space-y-5">
      <MonthPicker value={month} onChange={setMonth} />

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<ArrowUpCircle size={18} />} label="Income" value={formatCurrency(income)} color="text-emerald-400" />
            <StatCard icon={<ArrowDownCircle size={18} />} label="Expenses" value={formatCurrency(expenses)} color="text-red-400" />
            <StatCard icon={<PiggyBank size={18} />} label="Saved" value={formatCurrency(savings)} color={savings >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <StatCard icon={<Wallet size={18} />} label="Transactions" value={String(txns.length)} color="text-blue-400" />
          </div>

          {pieData.length > 0 && (
            <div className="card">
              <p className="section-title">Spending Breakdown</p>
              <div className="flex items-center gap-4">
                <div className="w-36 h-36 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 overflow-hidden">
                  {pieData.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-300 truncate flex-1">{item.icon} {item.name}</span>
                      <span className="text-sm font-medium text-slate-100 tabular-nums">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  {pieData.length > 5 && <p className="text-xs text-slate-500">+{pieData.length - 5} more</p>}
                </div>
              </div>
            </div>
          )}

          {pieData.length === 0 && txns.length === 0 && (
            <div className="card text-center py-10">
              <p className="text-slate-500 mb-1">No data this month</p>
              <button onClick={() => router.push('/add')} className="text-emerald-400 text-sm font-medium">
                Add your first transaction
              </button>
            </div>
          )}

          {hasBarData && (
            <div className="card">
              <p className="section-title">6-Month Comparison</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `₪${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <Legend color="bg-emerald-500" label="Income" />
                <Legend color="bg-red-500" label="Expenses" />
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/cashflow')}
            className="card w-full flex items-center justify-between hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <TrendingUp size={16} className="text-emerald-400" /> Cash Flow &amp; Trends
            </div>
            <span className="text-slate-600 text-xs">→</span>
          </button>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card">
      <div className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${color}`}>{icon} {label}</div>
      <p className="text-xl font-bold text-slate-100 tabular-nums">{value}</p>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} /> {label}
    </div>
  )
}

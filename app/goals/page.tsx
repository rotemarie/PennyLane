'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSavingsGoals, addSavingsGoal, deleteSavingsGoal, contributeToGoal } from '@/lib/api'
import { formatCurrency, percentOf } from '@/lib/utils'
import type { SavingsGoal } from '@/lib/types'
import { Plus, Trash2, X, Target, Minus } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

const GOAL_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6']
const GOAL_ICONS = ['🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏖️', '🎯', '💰', '🏥', '🎁']

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setGoals(await getSavingsGoals())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-center py-20 text-slate-500">Loading...</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Savings Goals</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost flex items-center gap-1">
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {showAdd && <AddGoalForm onClose={() => { setShowAdd(false); load() }} />}

      {goals.length === 0 && !showAdd && (
        <div className="text-center py-16 text-slate-500">
          <Target size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No savings goals yet</p>
          <p className="text-sm mb-4">Set a target and track your progress</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} className="inline mr-1" /> Create Goal
          </button>
        </div>
      )}

      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onUpdate={load} />
        ))}
      </div>
    </div>
  )
}

function GoalCard({ goal, onUpdate }: { goal: SavingsGoal; onUpdate: () => void }) {
  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState('')
  const pct = percentOf(goal.current_amount, goal.target_amount)
  const remaining = goal.target_amount - goal.current_amount
  const isComplete = goal.current_amount >= goal.target_amount

  let daysLeft: number | null = null
  if (goal.deadline) {
    daysLeft = differenceInDays(parseISO(goal.deadline), new Date())
  }

  async function handleContribute(isAdd: boolean) {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    await contributeToGoal(goal.id, isAdd ? val : -val)
    setAmount('')
    setShowContribute(false)
    onUpdate()
  }

  async function handleDelete() {
    await deleteSavingsGoal(goal.id)
    onUpdate()
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: goal.color + '20' }}>
          {goal.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{goal.name}</span>
            <button onClick={handleDelete} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400 mt-0.5">
            <span>{formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}</span>
            <span className={isComplete ? 'text-emerald-400 font-medium' : ''}>{pct}%</span>
          </div>
        </div>
      </div>

      <div className="mt-3 w-full h-3 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isComplete ? '#22c55e' : goal.color }} />
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-slate-500">
          {isComplete ? (
            <span className="text-emerald-400 font-medium">Goal reached!</span>
          ) : (
            <span>{formatCurrency(remaining)} to go</span>
          )}
          {daysLeft !== null && !isComplete && (
            <span className="ml-2">{daysLeft > 0 ? `${daysLeft} days left` : 'Past deadline'}</span>
          )}
        </div>
        {!isComplete && (
          <button onClick={() => setShowContribute(!showContribute)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
            {showContribute ? 'Cancel' : '+ Add funds'}
          </button>
        )}
      </div>

      {showContribute && (
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₪</span>
            <input type="number" min="0" step="10" placeholder="100" value={amount}
              onChange={(e) => setAmount(e.target.value)} className="pl-7 py-2 text-sm" autoFocus />
          </div>
          <button onClick={() => handleContribute(true)} className="btn-primary py-2 px-4 text-sm"><Plus size={14} /></button>
          <button onClick={() => handleContribute(false)} className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-xl text-sm"><Minus size={14} /></button>
        </div>
      )}
    </div>
  )
}

function AddGoalForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('🎯')
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0])

  async function handleCreate() {
    if (!name || !target) return
    await addSavingsGoal({
      name,
      target_amount: parseFloat(target),
      current_amount: 0,
      deadline: deadline || null,
      color: selectedColor,
      icon: selectedIcon,
    })
    onClose()
  }

  return (
    <div className="card space-y-4">
      <p className="font-semibold">New Savings Goal</p>
      <div>
        <label className="section-title">Goal Name</label>
        <input type="text" placeholder="e.g., Emergency Fund" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="section-title">Target Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
          <input type="number" min="0" step="100" placeholder="5000" value={target} onChange={(e) => setTarget(e.target.value)} className="pl-8" />
        </div>
      </div>
      <div>
        <label className="section-title">Deadline (optional)</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <div>
        <label className="section-title">Icon</label>
        <div className="flex flex-wrap gap-2">
          {GOAL_ICONS.map((icon) => (
            <button key={icon} onClick={() => setSelectedIcon(icon)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
                selectedIcon === icon ? 'bg-slate-700 ring-2 ring-emerald-500' : 'bg-slate-800 hover:bg-slate-700'}`}>
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="section-title">Color</label>
        <div className="flex gap-2">
          {GOAL_COLORS.map((color) => (
            <button key={color} onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
      <button onClick={handleCreate} disabled={!name || !target} className="btn-primary w-full">Create Goal</button>
    </div>
  )
}

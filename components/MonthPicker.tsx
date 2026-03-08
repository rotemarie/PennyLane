'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthLabel, monthKey } from '@/lib/utils'
import { format, addMonths, subMonths, parse } from 'date-fns'

interface Props {
  value: string
  onChange: (month: string) => void
}

export default function MonthPicker({ value, onChange }: Props) {
  const date = parse(value + '-01', 'yyyy-MM-dd', new Date())
  const isCurrent = value === monthKey()

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"
      >
        <ChevronLeft size={20} />
      </button>
      <h2 className="text-lg font-semibold text-slate-100">{monthLabel(value)}</h2>
      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        disabled={isCurrent}
        className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 disabled:opacity-30"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

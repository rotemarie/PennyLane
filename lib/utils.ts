import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths } from 'date-fns'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function monthKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM')
}

export function monthLabel(key: string): string {
  const d = parse(key + '-01', 'yyyy-MM-dd', new Date())
  return format(d, 'MMMM yyyy')
}

export function shortMonthLabel(key: string): string {
  const d = parse(key + '-01', 'yyyy-MM-dd', new Date())
  return format(d, 'MMM')
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getMonthRange(monthStr: string) {
  const d = parse(monthStr + '-01', 'yyyy-MM-dd', new Date())
  return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(d), 'yyyy-MM-dd') }
}

export function getDaysInMonth(monthStr: string) {
  const d = parse(monthStr + '-01', 'yyyy-MM-dd', new Date())
  return eachDayOfInterval({ start: startOfMonth(d), end: endOfMonth(d) })
}

export function isCurrentMonth(monthStr: string): boolean {
  const d = parse(monthStr + '-01', 'yyyy-MM-dd', new Date())
  return isSameMonth(d, new Date())
}

export function getPreviousMonths(count: number): string[] {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => monthKey(subMonths(now, i))).reverse()
}

export function percentOf(value: number, total: number) {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

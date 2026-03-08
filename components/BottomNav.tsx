'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, List, PlusCircle, PiggyBank, Target } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'History', icon: List },
  { href: '/add', label: 'Add', icon: PlusCircle, isCenter: true },
  { href: '/budgets', label: 'Budget', icon: PiggyBank },
  { href: '/goals', label: 'Goals', icon: Target },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pb-[var(--safe-bottom)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-colors ${
                item.isCenter
                  ? 'text-emerald-400 -mt-3'
                  : isActive
                  ? 'text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.isCenter ? (
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <Icon size={24} />
                </div>
              ) : (
                <Icon size={20} />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

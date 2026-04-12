'use client'
// components/AppSidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard',    icon: '◈', label: 'Dashboard'   },
  { href: '/courses',      icon: '◉', label: 'Courses'     },
  { href: '/learn',        icon: '▶', label: 'Learn'       },
  { href: '/quiz',         icon: '◆', label: 'Challenge'   },
  { href: '/leaderboard',  icon: '▲', label: 'Ranks'       },
  { href: '/badges',       icon: '✦', label: 'Badges'      },
  { href: '/community',    icon: '◎', label: 'Community'   },
  { href: '/subscription', icon: '⭐', label: 'Plans'       },
]

export default function AppSidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createBrowserSupabase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-[72px] bg-codex-surface border-r border-codex-border
                      flex flex-col items-center py-5 gap-1 flex-shrink-0 z-20">
      {/* Logo */}
      <Link href="/dashboard" className="mb-6">
        <div className="font-display font-black text-[10px] text-codex-gold tracking-widest
                        w-10 h-10 rounded-xl bg-codex-gold/10 border border-codex-gold/30
                        flex items-center justify-center">
          CX
        </div>
      </Link>

      {/* Nav items */}
      {NAV.map(item => {
        const active = pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} title={item.label}
            className={`cx-nav-btn ${active ? 'cx-nav-btn-active' : 'cx-nav-btn-idle'}`}>
            <span className="text-sm leading-none">{item.icon}</span>
            <span className="text-[7px] font-bold tracking-wider uppercase leading-none">
              {item.label.slice(0, 3)}
            </span>
          </Link>
        )
      })}

      {/* Logout at bottom */}
      <div className="mt-auto">
        <button onClick={handleLogout} title="Sign out"
          className="cx-nav-btn cx-nav-btn-idle opacity-50 hover:opacity-100">
          <span className="text-sm">⎋</span>
          <span className="text-[7px] font-bold tracking-wider uppercase">Out</span>
        </button>
      </div>
    </aside>
  )
}

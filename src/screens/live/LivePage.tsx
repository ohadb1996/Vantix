import { Play, Users, Clock } from 'lucide-react'

const mockLiveEvents = [
  {
    title: 'בישול חי עם שף אלון גולן',
    chef: 'שף אלון גולן',
    viewers: 1240,
    status: 'live',
    thumbnail: '/api/placeholder/400/300',
  },
  {
    title: 'טעימות יין עם סומלייה מוביל',
    chef: 'דני כהן',
    viewers: 856,
    status: 'live',
    thumbnail: '/api/placeholder/400/300',
  },
  {
    title: 'סדנת קינוחים - מתכונים ביתיים',
    chef: 'ג׳ולי מגן',
    viewers: 0,
    status: 'upcoming',
    thumbnail: '/api/placeholder/400/300',
  },
]

export const LivePage = () => {
  return (
    <div className="space-y-10">
      <header className="space-y-6 rounded-3xl border border-vantix-cyan/30 bg-gradient-to-l from-vantix-cyan to-vantix-orange/12 p-6 shadow-[0_30px_70px_rgba(255,107,53,0.18)] backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-vantix-cyan/80">
              live culinary
            </p>
            <h1 className="font-display text-4xl text-vantix-fg sm:text-5xl">
              בישול חי וטעימות בזמן אמת
            </h1>
            <p className="max-w-2xl text-sm text-vantix-fg-muted">
              צפה בשפים מובילים מבשלים ומסבירים בזמן אמת. שאל שאלות, קבל טיפים וצפה
              בתהליך היצירה
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockLiveEvents.map((event) => (
          <div
            key={event.title}
            className="group relative overflow-hidden rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised shadow-[0_18px_40px_rgba(0,0,0,0.05)] transition hover:shadow-[0_24px_50px_rgba(255,107,53,0.15)]"
          >
            <div className="relative aspect-video bg-gradient-to-br from-vantix-cyan/20 to-vantix-orange/5">
              {event.status === 'live' && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-vantix-surface-raised" />
                  בשידור חי
                </div>
              )}
              {event.status === 'upcoming' && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-brand-slate/80 px-3 py-1.5 text-xs font-semibold text-white">
                  <Clock className="h-3 w-3" />
                  בקרוב
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="rounded-full bg-vantix-surface-raised/90 p-4 shadow-lg transition hover:scale-110">
                  <Play className="h-6 w-6 text-vantix-cyan" fill="currentColor" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-vantix-fg">
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-vantix-fg-muted">{event.chef}</p>
              {event.status === 'live' && (
                <div className="mt-4 flex items-center gap-2 text-sm text-vantix-fg-subtle">
                  <Users className="h-4 w-4" />
                  <span>{event.viewers.toLocaleString()} צופים</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}



import { Search } from 'lucide-react'

const mockExperiences = [
  {
    name: 'חווית טעימה פרטית',
    description: 'ארוחת שף אינטימית עם הסבר על כל מנה',
    duration: '2 שעות',
    rating: 4.9,
    price: '₪450',
    tags: ['private', 'chef experience'],
  },
  {
    name: 'סדנת בישול ביתית',
    description: 'למד להכין מנות חתימה עם שף מקצועי',
    duration: '3 שעות',
    rating: 4.8,
    price: '₪350',
    tags: ['workshop', 'hands-on'],
  },
  {
    name: 'טעימות יין וקינוחים',
    description: 'שילוב מושלם של יינות איכותיים עם קינוחים מתוחכמים',
    duration: '1.5 שעות',
    rating: 4.7,
    price: '₪280',
    tags: ['wine', 'dessert'],
  },
]

const experienceCategories = [
  'חוויות שף',
  'סדנאות בישול',
  'טעימות יין',
  'ארוחות פרטיות',
  'חדש השבוע',
  'מומלץ',
]

export const ExperiencesPage = () => {
  return (
    <div className="space-y-10">
      <header className="space-y-6 rounded-3xl border border-vantix-cyan/30 bg-gradient-to-l from-vantix-cyan to-vantix-orange/12 p-6 shadow-[0_30px_70px_rgba(255,107,53,0.18)] backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-vantix-cyan/80">
              culinary experiences
            </p>
            <h1 className="font-display text-4xl text-vantix-fg sm:text-5xl">
              חוויות קולינריות ייחודיות
            </h1>
            <p className="max-w-2xl text-sm text-vantix-fg-muted">
              גלה חוויות קולינריות מעבר לארוחה רגילה. מסדנאות בישול ועד טעימות שף פרטיות
            </p>
          </div>
          <button className="rounded-full border border-vantix-cyan/25 bg-vantix-cyan/10 px-5 py-3 text-sm font-semibold text-vantix-cyan transition hover:bg-vantix-cyan/15 hover:text-vantix-fg">
            מצא חוויה עבורי
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-vantix-cyan/25 bg-vantix-surface-raised px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
            <Search className="h-5 w-5 text-vantix-cyan" />
            <input
              placeholder="מה מתחשק לך? סדנת בישול, טעימות יין, ארוחת שף..."
              className="w-full bg-transparent text-sm text-vantix-fg placeholder:text-vantix-fg-subtle focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {experienceCategories.map((category) => (
              <button
                key={category}
                className="rounded-full border border-vantix-cyan/25 bg-vantix-cyan/10 px-3 py-2 text-xs font-semibold text-vantix-fg-muted transition hover:bg-vantix-cyan/15 hover:text-vantix-fg"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockExperiences.map((experience) => (
          <div
            key={experience.name}
            className="rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-6 shadow-[0_18px_40px_rgba(0,0,0,0.05)] transition hover:shadow-[0_24px_50px_rgba(255,107,53,0.15)]"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold text-vantix-fg">
                    {experience.name}
                  </h3>
                  <p className="mt-1 text-sm text-vantix-fg-muted">
                    {experience.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-vantix-fg-subtle">
                <span>{experience.duration}</span>
                <span>•</span>
                <span>⭐ {experience.rating}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-vantix-fg">
                  {experience.price}
                </span>
                <button className="rounded-full bg-gradient-to-l from-vantix-cyan to-vantix-orange px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                  הזמן עכשיו
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}



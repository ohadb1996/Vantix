export type MoodCollection = {
  id: string
  title: string
  description: string
  tags: string[]
  priority: number
}

export type SmartFilter = {
  id: string
  label: string
  icon?: string
  tone: 'primary' | 'neutral' | 'elevated'
  order: number
}

export type SpotlightCampaign = {
  id: string
  title: string
  description: string
  ctaLabel: string
  href: string
  illustration: string | null
}


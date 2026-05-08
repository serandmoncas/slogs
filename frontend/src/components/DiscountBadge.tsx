import { colors, fonts, radius } from '@/lib/styles'

export default function DiscountBadge({ pct }: { pct: string | number }) {
  const value = Number(pct)
  if (!value) return null
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: radius.full,
      background: colors.greenDim,
      color: colors.green,
      fontSize: 11,
      fontFamily: fonts.mono,
      fontWeight: 700,
    }}>
      -{value}% OFF
    </span>
  )
}

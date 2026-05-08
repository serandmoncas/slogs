import { colors } from '@/lib/styles'

interface Props { size?: number }

export default function LoadingSpinner({ size = 24 }: Props) {
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .slogs-spinner { animation: spin 0.7s linear infinite; }
      `}</style>
      <div
        className="slogs-spinner"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${colors.border}`,
          borderTopColor: colors.amber,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
    </>
  )
}

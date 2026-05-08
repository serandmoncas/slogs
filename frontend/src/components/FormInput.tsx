'use client'
import { colors, fonts, radius } from '@/lib/styles'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export default function FormInput({ label, error, hint, ...props }: Props) {
  const borderColor = error ? colors.red : colors.border

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        style={{ fontSize: 12, fontFamily: fonts.body, color: colors.textMuted, fontWeight: 500 }}
      >
        {label}
      </label>
      <input
        {...props}
        style={{
          background: colors.panelAlt,
          border: `1px solid ${borderColor}`,
          borderRadius: radius.md,
          padding: '8px 12px',
          color: colors.text,
          fontFamily: fonts.body,
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
          boxSizing: 'border-box',
          ...props.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? colors.red : colors.amber
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? colors.red : colors.border
          props.onBlur?.(e)
        }}
      />
      {error && (
        <span style={{ fontSize: 11, color: colors.red, fontFamily: fonts.body }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 11, color: colors.textDim, fontFamily: fonts.body }}>{hint}</span>
      )}
    </div>
  )
}

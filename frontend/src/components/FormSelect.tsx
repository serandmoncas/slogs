'use client'
import { colors, fonts, radius } from '@/lib/styles'

interface Option { value: string; label: string }

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Option[]
  error?: string
  hint?: string
  placeholder?: string
}

export default function FormSelect({ label, options, error, hint, placeholder, ...props }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontFamily: fonts.body, color: colors.textMuted, fontWeight: 500 }}>
        {label}
      </label>
      <select
        {...props}
        style={{
          background: colors.panelAlt,
          border: `1px solid ${error ? colors.red : colors.border}`,
          borderRadius: radius.md,
          padding: '8px 12px',
          color: props.value === '' ? colors.textDim : colors.text,
          fontFamily: fonts.body,
          fontSize: 14,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          cursor: 'pointer',
          ...props.style,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: colors.panelAlt, color: colors.text }}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span style={{ fontSize: 11, color: colors.red, fontFamily: fonts.body }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 11, color: colors.textDim, fontFamily: fonts.body }}>{hint}</span>}
    </div>
  )
}

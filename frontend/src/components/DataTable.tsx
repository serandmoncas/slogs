import { colors, fonts, radius } from '@/lib/styles'
import LoadingSpinner from './LoadingSpinner'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  keyExtractor: (row: T) => string | number
}

export default function DataTable<T>({
  data,
  columns,
  loading,
  emptyMessage = 'Sin resultados',
  keyExtractor,
}: Props<T>) {
  return (
    <div
      style={{ overflowX: 'auto', borderRadius: radius.lg, border: `1px solid ${colors.border}` }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: fonts.body }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.sidebar }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 40, textAlign: 'center' }}>
                <LoadingSpinner size={32} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: colors.textDim,
                  fontSize: 14,
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                style={{
                  borderBottom: `1px solid ${colors.border}`,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.panelAlt
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: colors.text,
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

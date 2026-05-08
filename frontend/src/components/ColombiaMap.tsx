'use client'
import { colors } from '@/lib/styles'

interface Ruta {
  origen: string
  destino: string
}

const CITIES: Record<string, [number, number]> = {
  Bogotá: [155, 195],
  Medellín: [110, 155],
  Cali: [105, 235],
  Barranquilla: [138, 58],
  Cartagena: [115, 65],
  Buenaventura: [88, 230],
  'Santa Marta': [158, 52],
  Pereira: [112, 190],
}

const COLOMBIA_PATH =
  'M138,15 L165,18 L192,28 L210,42 L222,52 L232,60 L240,72 L245,88 L248,105 ' +
  'L250,122 L252,140 L255,158 L258,175 L260,192 L258,210 L252,228 L244,246 ' +
  'L232,262 L218,278 L205,292 L192,305 L180,318 L168,330 L155,338 L142,342 ' +
  'L128,340 L115,333 L102,320 L90,305 L80,288 L72,270 L66,252 L62,234 ' +
  'L60,216 L58,198 L55,180 L50,162 L46,145 L44,128 L46,112 L50,96 L56,82 ' +
  'L64,70 L74,60 L86,52 L98,45 L110,38 L122,28 L132,20 Z'

export default function ColombiaMap({ rutas = [] }: { rutas?: Ruta[] }) {
  const activeCities = new Set(rutas.flatMap((r) => [r.origen, r.destino]))

  return (
    <>
      <style>{`
        @keyframes pulse-city {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.5); }
        }
        @keyframes travel {
          0%   { stroke-dashoffset: 200; opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        .city-pulse { animation: pulse-city 2s ease-in-out infinite; transform-origin: center; }
        .route-line { animation: travel 3s ease-in-out infinite; stroke-dasharray: 6 4; }
      `}</style>
      <svg viewBox="0 0 300 370" style={{ width: '100%', height: '100%', maxHeight: 340 }}>
        {/* glow de fondo */}
        <defs>
          <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.blue} stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="city-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="150" cy="185" rx="120" ry="150" fill="url(#map-glow)" />

        {/* contorno Colombia */}
        <path
          d={COLOMBIA_PATH}
          fill={`${colors.blue}08`}
          stroke={`${colors.blue}40`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* grid tenue */}
        {[80, 120, 160, 200, 240, 280].map((y) => (
          <line
            key={y}
            x1="40"
            y1={y}
            x2="265"
            y2={y}
            stroke={colors.border}
            strokeWidth="0.5"
            strokeDasharray="3,5"
          />
        ))}
        {[80, 120, 160, 200, 240].map((x) => (
          <line
            key={x}
            x1={x}
            y1="15"
            x2={x}
            y2="345"
            stroke={colors.border}
            strokeWidth="0.5"
            strokeDasharray="3,5"
          />
        ))}

        {/* rutas activas */}
        {rutas.map((ruta, i) => {
          const a = CITIES[ruta.origen]
          const b = CITIES[ruta.destino]
          if (!a || !b) return null
          return (
            <line
              key={i}
              className="route-line"
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              stroke={colors.amber}
              strokeWidth="1.5"
              style={{ animationDelay: `${i * 0.8}s` }}
            />
          )
        })}

        {/* ciudades */}
        {Object.entries(CITIES).map(([name, [cx, cy]]) => {
          const isActive = activeCities.has(name)
          const color = isActive ? colors.amber : colors.blue
          return (
            <g key={name} filter="url(#city-glow)">
              {isActive && (
                <circle cx={cx} cy={cy} r={8} fill={`${colors.amber}20`} className="city-pulse" />
              )}
              <circle cx={cx} cy={cy} r={3} fill={color} opacity={isActive ? 1 : 0.5} />
              <text
                x={cx + 6}
                y={cy + 4}
                fontSize={7}
                fill={color}
                opacity={isActive ? 0.9 : 0.45}
                fontFamily="'IBM Plex Sans', sans-serif"
              >
                {name}
              </text>
            </g>
          )
        })}
      </svg>
    </>
  )
}

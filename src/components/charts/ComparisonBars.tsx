import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ChartTheme } from '../../lib/palette'
import { ChartLegend, ChartTooltip, axisProps, moneyTick } from './common'

interface Row { label: string; a: number; b: number }

/**
 * Deux mesures comparées catégorie par catégorie (ex. montant investi et valeur
 * actuelle). Barres horizontales : les libellés restent lisibles.
 */
export function ComparisonBars({ data, theme, names, height }: {
  data: Row[]
  theme: ChartTheme
  names: [string, string]
  height?: number
}) {
  const chartHeight = height ?? Math.max(180, data.length * 46 + 30)
  return (
    <>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke={theme.gridline} horizontal={false} />
          <XAxis type="number" tickFormatter={moneyTick} {...axisProps(theme)} axisLine={false} />
          <YAxis type="category" dataKey="label" width={124} {...axisProps(theme)} axisLine={false} />
          <Tooltip
            cursor={{ fill: theme.gridline, fillOpacity: 0.45 }}
            content={({ active, label, payload }: { active?: boolean; label?: string; payload?: Array<{ payload?: Row }> }) => {
              const point = payload?.[0]?.payload
              if (!point) return null
              return (
                <ChartTooltip
                  active={active}
                  label={label}
                  formatLabel={(value) => value}
                  entries={[
                    { name: names[0], value: point.a, color: theme.neutral },
                    { name: names[1], value: point.b, color: theme.series[0] },
                  ]}
                />
              )
            }}
          />
          <Bar animationDuration={500} dataKey="a" fill={theme.neutral} maxBarSize={12} radius={[0, 4, 4, 0]} />
          <Bar animationDuration={500} dataKey="b" fill={theme.series[0]} maxBarSize={12} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ label: names[0], color: theme.neutral }, { label: names[1], color: theme.series[0] }]} />
    </>
  )
}

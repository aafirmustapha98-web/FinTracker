import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { formatMonthShort } from '../../lib/date'
import type { ChartTheme } from '../../lib/palette'
import { ChartLegend, ChartTooltip, axisProps, moneyTick } from './common'

interface TooltipArgs {
  active?: boolean
  label?: string
  payload?: Array<{ payload?: Record<string, number> }>
}

const GRID_HEIGHT = 250

/** Évolution du patrimoine net (une seule série : pas de légende nécessaire). */
export function NetWorthTrend({ data, theme, height = GRID_HEIGHT }: {
  data: Array<{ month: string; net: number; assets: number; debts: number }>
  theme: ChartTheme
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={theme.gridline} vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonthShort} {...axisProps(theme)} minTickGap={12} />
        <YAxis tickFormatter={moneyTick} width={52} {...axisProps(theme)} axisLine={false} />
        <Tooltip
          cursor={{ stroke: theme.axis, strokeWidth: 1 }}
          content={({ active, label, payload }: TooltipArgs) => {
            const point = payload?.[0]?.payload
            if (!point) return null
            return (
              <ChartTooltip
                active={active}
                label={label}
                entries={[
                  { name: 'Patrimoine net', value: point.net, color: theme.series[0] },
                  { name: 'Actifs', value: point.assets, color: theme.textMuted },
                  { name: 'Dettes', value: -point.debts, color: theme.textMuted },
                ]}
              />
            )
          }}
        />
        <Area
          animationDuration={500}
          type="monotone" dataKey="net"
          stroke={theme.series[0]} strokeWidth={2} strokeLinecap="round"
          fill={theme.series[0]} fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: theme.surface, fill: theme.series[0] }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Revenus et dépenses côte à côte, mois par mois. */
export function IncomeExpenseBars({ data, theme, height = GRID_HEIGHT }: {
  data: Array<{ month: string; income: number; expense: number; savings: number }>
  theme: ChartTheme
  height?: number
}) {
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }} barGap={2} barCategoryGap="26%">
          <CartesianGrid stroke={theme.gridline} vertical={false} />
          <XAxis dataKey="month" tickFormatter={formatMonthShort} {...axisProps(theme)} minTickGap={8} />
          <YAxis tickFormatter={moneyTick} width={52} {...axisProps(theme)} axisLine={false} />
          <Tooltip
            cursor={{ fill: theme.gridline, fillOpacity: 0.45 }}
            content={({ active, label, payload }: TooltipArgs) => {
              const point = payload?.[0]?.payload
              if (!point) return null
              return (
                <ChartTooltip
                  active={active}
                  label={label}
                  entries={[
                    { name: 'Revenus', value: point.income, color: theme.income },
                    { name: 'Dépenses', value: point.expense, color: theme.expense },
                    { name: 'Épargne', value: point.savings, color: theme.savings },
                  ]}
                />
              )
            }}
          />
          <Bar animationDuration={500} dataKey="income" fill={theme.income} maxBarSize={16} radius={[4, 4, 0, 0]} />
          <Bar animationDuration={500} dataKey="expense" fill={theme.expense} maxBarSize={16} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ label: 'Revenus', color: theme.income }, { label: 'Dépenses', color: theme.expense }]} />
    </>
  )
}

/** Épargne cumulée (série unique). */
export function SavingsTrend({ data, theme, height = GRID_HEIGHT }: {
  data: Array<{ month: string; cumulative: number; deposits: number }>
  theme: ChartTheme
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={theme.gridline} vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonthShort} {...axisProps(theme)} minTickGap={12} />
        <YAxis tickFormatter={moneyTick} width={52} {...axisProps(theme)} axisLine={false} />
        <Tooltip
          cursor={{ stroke: theme.axis, strokeWidth: 1 }}
          content={({ active, label, payload }: TooltipArgs) => {
            const point = payload?.[0]?.payload
            if (!point) return null
            return (
              <ChartTooltip
                active={active}
                label={label}
                entries={[
                  { name: 'Épargne cumulée', value: point.cumulative, color: theme.savings },
                  { name: 'Versements du mois', value: point.deposits, color: theme.textMuted },
                ]}
              />
            )
          }}
        />
        <Area
          animationDuration={500}
          type="monotone" dataKey="cumulative"
          stroke={theme.savings} strokeWidth={2}
          fill={theme.savings} fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: theme.surface, fill: theme.savings }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Montant épargné chaque mois (série unique). */
export function MonthlyBars({ data, theme, dataKey, color, height = 200 }: {
  data: Array<Record<string, number | string>>
  theme: ChartTheme
  dataKey: string
  color: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid stroke={theme.gridline} vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonthShort} {...axisProps(theme)} minTickGap={8} />
        <YAxis tickFormatter={moneyTick} width={52} {...axisProps(theme)} axisLine={false} />
        <Tooltip
          cursor={{ fill: theme.gridline, fillOpacity: 0.45 }}
          content={({ active, label, payload }: TooltipArgs) => {
            const point = payload?.[0]?.payload
            if (!point) return null
            return (
              <ChartTooltip
                active={active}
                label={label}
                entries={[{ name: 'Montant', value: Number(point[dataKey]), color }]}
              />
            )
          }}
        />
        <Bar animationDuration={500} dataKey={dataKey} fill={color} maxBarSize={18} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

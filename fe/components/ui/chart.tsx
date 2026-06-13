"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    color?: string
  }
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  config,
  children,
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const chartId = React.useId()
  const resolvedId = `chart-${id || chartId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={resolvedId}
        className={cn(
          "flex aspect-auto justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-legend-item-text]:text-foreground [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-text]:fill-foreground",
          className,
        )}
        style={
          Object.entries(config).reduce(
            (styles, [key, value]) => ({
              ...styles,
              [`--color-${key}`]: value.color,
            }),
            {} as React.CSSProperties,
          )
        }
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartTooltip({
  ...props
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return <RechartsPrimitive.Tooltip {...props} />
}

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  formatter,
}: React.ComponentProps<"div"> & {
  active?: boolean
  payload?: Array<{
    dataKey?: string | number
    name?: string
    value?: number | string
    color?: string
    payload?: Record<string, unknown>
  }>
  label?: string | number
  formatter?: (value: number | string, name: string) => React.ReactNode
}) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-2xl border border-border bg-background/95 px-3 py-2 shadow-xl backdrop-blur",
        className,
      )}
    >
      {label !== undefined && (
        <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
      )}
      <div className="space-y-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "")
          const itemConfig = config[key]
          const itemLabel = itemConfig?.label ?? item.name ?? key
          const itemColor = item.color ?? itemConfig?.color ?? "#000000"

          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: itemColor }}
                />
                <span className="text-xs text-muted-foreground">
                  {itemLabel}
                </span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {formatter
                  ? formatter(
                      typeof item.value === "number" ? item.value : item.value ?? 0,
                      String(itemLabel),
                    )
                  : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartLegend({
  ...props
}: React.ComponentProps<typeof RechartsPrimitive.Legend>) {
  return <RechartsPrimitive.Legend {...props} />
}

function ChartLegendContent({
  payload,
  className,
}: React.ComponentProps<"div"> & {
  payload?: Array<{
    value?: string
    color?: string
    dataKey?: string | number
  }>
}) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-4 pt-2", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? "")
        const itemConfig = config[key]

        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: item.color ?? itemConfig?.color }}
            />
            <span className="text-xs text-muted-foreground">
              {itemConfig?.label ?? item.value ?? key}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
}

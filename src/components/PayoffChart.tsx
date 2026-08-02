"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlanResult } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";
import { Card } from "./ui";

export function PayoffChart({ plan }: { plan: PlanResult }) {
  const { format } = useMoney();
  const data = [
    { label: "Now", balance: plan.totalPrincipal },
    ...plan.schedule.map((row) => ({
      label: row.label,
      balance: Math.round(row.totalBalance),
    })),
  ];

  // Keep the x-axis readable: show at most ~8 tick labels.
  const step = Math.max(1, Math.ceil(data.length / 8));
  const last = data[data.length - 1];

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="kicker">Balance over time</h3>
        <span className="flex items-center gap-1.5 rounded-full bg-[var(--success)]/12 px-2.5 py-1 text-xs text-[var(--success)] ring-1 ring-[var(--success)]/25">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          Debt-free{" "}
          <span className="font-mono-num font-semibold">
            {plan.debtFreeLabel}
          </span>
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8fa6ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
              {/* line: blue → green, echoing the graphics */}
              <linearGradient id="balStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8fa6ff" />
                <stop offset="100%" stopColor="var(--success)" />
              </linearGradient>
              <filter id="balGlow" x="-20%" y="-40%" width="140%" height="180%">
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="8"
                  floodColor="#5b7cfa"
                  floodOpacity="0.35"
                />
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="4 6"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              interval={step - 1}
              tickLine={false}
              axisLine={false}
              dy={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
              }
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
              formatter={(v) => [format(Number(v)), "Balance"]}
              contentStyle={{
                background: "var(--surface-solid)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--foreground)",
                boxShadow: "var(--shadow)",
              }}
              labelStyle={{ color: "var(--muted)" }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="url(#balStroke)"
              strokeWidth={3}
              strokeLinecap="round"
              fill="url(#balFill)"
              style={{ filter: "url(#balGlow)" }}
              activeDot={{
                r: 5,
                fill: "var(--brand)",
                stroke: "var(--surface-solid)",
                strokeWidth: 2,
              }}
            />
            {/* glowing debt-free endpoint */}
            <ReferenceDot
              x={last.label}
              y={last.balance}
              r={5}
              fill="var(--success)"
              stroke="var(--surface-solid)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

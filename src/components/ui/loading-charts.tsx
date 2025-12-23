"use client";

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export function LoadingBarChart({ numBars = 7 }: { numBars?: number }) {
  const [data, setData] = React.useState<Array<{ name: string; value: number }>>([]);
  const [maxDomain, setMaxDomain] = React.useState(1000);

  React.useEffect(() => {
    let idx = 0;
    const tick = () => {
      const base = 500 + Math.floor(Math.random() * 2500);
      const newMax = base + Math.floor(Math.random() * 5000);
      setMaxDomain(newMax);
      const values = Array.from({ length: numBars }, (_, i) => {
        const phase = (idx + i) % numBars;
        const v = Math.max(50, base + Math.floor(Math.sin(phase / numBars * Math.PI * 2) * base * 0.6) + Math.floor(Math.random() * 800));
        return { name: `${i + 1}`, value: v };
      });
      setData(values);
      idx += 1;
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [numBars]);

  // 7 distinct teal shades (light → dark)
  const shades = [
    'hsl(171 65% 95%)', // lightest
    'hsl(171 65% 88%)',
    'hsl(171 65% 78%)',
    'hsl(171 65% 68%)',
    'hsl(171 65% 58%)', // primary
    'hsl(171 70% 48%)',
    'hsl(171 75% 38%)'  // darkest
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} domain={[0, maxDomain]} />
        <Bar dataKey="value">
          {data.map((entry, index) => {
            const ratio = Math.min(1, entry.value / Math.max(1, maxDomain));
            const shadeIndex = Math.max(0, Math.min(shades.length - 1, Math.floor(ratio * (shades.length - 1))));
            return <Cell key={`cell-load-${index}`} fill={shades[shadeIndex]} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LoadingDonutPie({ segments = 5 }: { segments?: number }) {
  const [data, setData] = React.useState<Array<{ name: string; value: number; color: string }>>([]);
  const palette = [
    'hsl(171 65% 95%)', // lightest
    'hsl(171 65% 88%)',
    'hsl(171 65% 78%)',
    'hsl(171 65% 68%)',
    'hsl(171 65% 58%)'  // primary
  ];

  React.useEffect(() => {
    const tick = () => {
      const vals = Array.from({ length: segments }, (_, i) => Math.max(1, Math.floor(Math.random() * 100)));
      const total = vals.reduce((s, v) => s + v, 0);
      const d = vals.map((v, i) => ({ name: `S${i+1}`, value: Math.round((v / total) * 100), color: palette[i % palette.length] }));
      setData(d);
    };
    tick();
    const id = setInterval(tick, 700);
    return () => clearInterval(id);
  }, [segments]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`load-pie-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}



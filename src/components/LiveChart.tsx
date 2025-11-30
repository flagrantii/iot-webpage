"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import type { SensorPoint } from "@/types/sensor";

type Props = {
  data: SensorPoint[];
  color?: string;
  unit?: string;
  min?: number;
  max?: number;
  title?: string;
};

export default function LiveChart({ data, color = "#10b981", unit, min, max, title }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
        <span className="text-4xl opacity-20">📉</span>
        <span className="text-sm">Waiting for data stream...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
        {title && (
            <div className="mb-2 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    LIVE
                </div>
            </div>
        )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
            <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
            <XAxis 
                dataKey="timestamp" 
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} 
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
            />
            <YAxis 
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[min ?? 'auto', max ?? 'auto']}
                width={30}
            />
            <Tooltip 
                contentStyle={{ 
                backgroundColor: '#111827', 
                borderColor: '#374151',
                borderRadius: '0.5rem',
                color: '#fff',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
                formatter={(value: number) => [`${value.toFixed(2)} ${unit || ''}`, 'Value']}
            />
            <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                strokeWidth={2}
                isAnimationActive={false} // Disable animation for smoother realtime updates
            />
            </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


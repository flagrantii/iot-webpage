"use client";

import { useMemo } from "react";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ReferenceLine,
} from "recharts";
import type { SensorPoint } from "@/types/sensor";

type Props = {
	series: SensorPoint[];
	height?: number;
	threshold?: number;
};

export function RealtimeChart({ series, height = 300, threshold }: Props) {
	const { data, stats } = useMemo(() => {
		const chartData = series.map((p, index) => ({
			t: new Date(p.timestamp).toLocaleTimeString([], { 
				hour: '2-digit', 
				minute: '2-digit',
				second: '2-digit'
			}),
			v: p.value,
			status: p.status,
			index,
			timestamp: p.timestamp
		}));

		const values = series.map(p => p.value);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const avg = values.reduce((a, b) => a + b, 0) / values.length;
		const latest = values[values.length - 1];

		return {
			data: chartData,
			stats: { min, max, avg, latest, count: values.length }
		};
	}, [series]);

	// Custom tooltip component
	const CustomTooltip = ({ active, payload, label }: { 
		active?: boolean; 
		payload?: Array<{ value: number; payload: { status?: string } }>; 
		label?: string 
	}) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload;
			return (
				<div className="bg-black/90 border border-gray-600 rounded-lg p-3 backdrop-blur-sm">
					<p className="text-green-400 font-medium text-sm">{label}</p>
					<p className="text-white">
						<span className="text-gray-400">Value: </span>
						<span className="font-mono font-bold">{payload[0].value.toFixed(2)}</span>
					</p>
					{data.status && (
						<p className="text-xs mt-1">
							<span className="text-gray-400">Status: </span>
							<span className={`font-medium ${
								data.status === 'critical' ? 'text-red-400' :
								data.status === 'warn' ? 'text-yellow-400' :
								'text-green-400'
							}`}>
								{data.status.toUpperCase()}
							</span>
						</p>
					)}
				</div>
			);
		}
		return null;
	};

	// Determine colors based on latest value and threshold
	const getAreaColor = () => {
		if (!threshold) return { stroke: "#00ff88", fill: "#00ff88" };
		
		const latest = stats.latest;
		if (latest > threshold) {
			return { stroke: "#ff4444", fill: "#ff4444" };
		} else if (latest > threshold * 0.8) {
			return { stroke: "#ffaa00", fill: "#ffaa00" };
		}
		return { stroke: "#00ff88", fill: "#00ff88" };
	};

	const colors = getAreaColor();

	return (
		<div className="w-full relative">
			{/* Stats Header */}
			<div className="flex items-center justify-between mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs w-full">
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Current</div>
						<div className={`font-mono font-bold text-sm ${
							stats.latest > (threshold || Infinity) ? 'text-red-400' :
							stats.latest > (threshold || Infinity) * 0.8 ? 'text-yellow-400' :
							'text-green-400'
						}`}>
							{stats.latest?.toFixed(2) || '--'}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Average</div>
						<div className="font-mono font-bold text-sm text-blue-400">
							{stats.avg?.toFixed(2) || '--'}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Range</div>
						<div className="font-mono font-bold text-sm text-gray-300">
							{stats.min?.toFixed(1)} - {stats.max?.toFixed(1)}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Samples</div>
						<div className="font-mono font-bold text-sm text-gray-300">
							{stats.count}
						</div>
					</div>
				</div>
			</div>

			{/* Chart */}
			<div className="bg-black/20 rounded-lg p-4 border border-gray-700/30">
				<ResponsiveContainer width="100%" height={height}>
					<AreaChart data={data} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
						<defs>
							<linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={colors.fill} stopOpacity={0.3}/>
								<stop offset="95%" stopColor={colors.fill} stopOpacity={0.05}/>
							</linearGradient>
						</defs>
						
						<CartesianGrid 
							strokeDasharray="2 2" 
							stroke="#333333" 
							opacity={0.5}
							horizontal={true}
							vertical={false}
						/>
						
						<XAxis 
							dataKey="t" 
							minTickGap={40}
							tick={{ fontSize: 11, fill: '#888888' }}
							axisLine={{ stroke: '#444444' }}
							tickLine={{ stroke: '#444444' }}
						/>
						
						<YAxis 
							dataKey="v" 
							width={60}
							tick={{ fontSize: 11, fill: '#888888' }}
							axisLine={{ stroke: '#444444' }}
							tickLine={{ stroke: '#444444' }}
							domain={['dataMin - 5', 'dataMax + 5']}
						/>
						
						{/* Threshold line */}
						{threshold && (
							<ReferenceLine 
								y={threshold} 
								stroke="#ff4444" 
								strokeDasharray="4 4" 
								strokeWidth={2}
								opacity={0.8}
							/>
						)}
						
						{/* Warning zone */}
						{threshold && (
							<ReferenceLine 
								y={threshold * 0.8} 
								stroke="#ffaa00" 
								strokeDasharray="2 2" 
								strokeWidth={1}
								opacity={0.6}
							/>
						)}
						
						<Tooltip 
							content={<CustomTooltip />}
							cursor={{ stroke: colors.stroke, strokeWidth: 1, strokeDasharray: '2 2' }}
						/>
						
						<Area 
							type="monotone" 
							dataKey="v" 
							stroke={colors.stroke}
							strokeWidth={2}
							fill="url(#areaGradient)"
							dot={false}
							activeDot={{ 
								r: 4, 
								fill: colors.stroke, 
								stroke: '#ffffff', 
								strokeWidth: 2 
							}}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			{/* Alert indicators */}
			{threshold && stats.latest > threshold && (
				<div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2">
					<div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
					<span className="text-red-400 text-xs font-medium uppercase tracking-wide">
						Threshold Exceeded
					</span>
				</div>
			)}
		</div>
	);
}

export default RealtimeChart;



"use client";

import { useMemo } from "react";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ReferenceLine,
	Cell,
} from "recharts";
import type { SensorPoint } from "@/types/sensor";

type Props = {
	series: SensorPoint[];
	height?: number;
	threshold?: number;
	sensorName?: string;
};

export function BinaryBarChart({ series, height = 300, threshold, sensorName }: Props) {
	const { data, stats } = useMemo(() => {
		// Group data by 2-second intervals for better visualization
		const groupedData: { [key: string]: { timestamp: number; value: number; count: number } } = {};
		
		series.forEach((point) => {
			// Round timestamp to nearest 2 seconds
			const roundedTime = Math.floor(point.timestamp / 2000) * 2000;
			const timeKey = new Date(roundedTime).toLocaleTimeString([], { 
				hour: '2-digit', 
				minute: '2-digit',
				second: '2-digit'
			});
			
			if (!groupedData[timeKey]) {
				groupedData[timeKey] = { timestamp: roundedTime, value: 0, count: 0 };
			}
			
			// For binary data, we want to show if ANY reading in the 2-second window was 1
			groupedData[timeKey].value = Math.max(groupedData[timeKey].value, point.value);
			groupedData[timeKey].count += 1;
		});

		const chartData = Object.entries(groupedData)
			.sort(([, a], [, b]) => a.timestamp - b.timestamp)
			.slice(-30) // Show last 30 data points (1 minute for 2-second intervals)
			.map(([timeKey, data]) => ({
				t: timeKey,
				v: data.value,
				count: data.count,
				timestamp: data.timestamp,
				status: data.value === 1 ? 'active' : 'inactive'
			}));

		const values = series.map(p => p.value);
		const activeCount = values.filter(v => v === 1).length;
		const inactiveCount = values.filter(v => v === 0).length;
		const latest = values[values.length - 1];
		const activePercentage = values.length > 0 ? (activeCount / values.length) * 100 : 0;

		return {
			data: chartData,
			stats: { 
				activeCount, 
				inactiveCount, 
				latest, 
				activePercentage,
				totalSamples: values.length 
			}
		};
	}, [series]);

	// Custom tooltip component
	const CustomTooltip = ({ active, payload, label }: { 
		active?: boolean; 
		payload?: Array<{ value: number; payload: { status?: string; count?: number } }>; 
		label?: string 
	}) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload;
			return (
				<div className="bg-black/90 border border-gray-600 rounded-lg p-3 backdrop-blur-sm">
					<p className="text-green-400 font-medium text-sm">{label}</p>
					<p className="text-white">
						<span className="text-gray-400">Status: </span>
						<span className={`font-medium ${
							payload[0].value === 1 ? 'text-red-400' : 'text-green-400'
						}`}>
							{payload[0].value === 1 ? 'ACTIVE' : 'INACTIVE'}
						</span>
					</p>
					{data.count && (
						<p className="text-xs text-gray-400 mt-1">
							Samples in window: {data.count}
						</p>
					)}
				</div>
			);
		}
		return null;
	};

	return (
		<div className="w-full relative">
			{/* Stats Header */}
			<div className="flex items-center justify-between mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs w-full">
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Current</div>
						<div className={`font-mono font-bold text-sm ${
							stats.latest === 1 ? 'text-red-400' : 'text-green-400'
						}`}>
							{stats.latest === 1 ? 'ACTIVE' : 'INACTIVE'}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Active Rate</div>
						<div className="font-mono font-bold text-sm text-yellow-400">
							{stats.activePercentage.toFixed(1)}%
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Active/Total</div>
						<div className="font-mono font-bold text-sm text-blue-400">
							{stats.activeCount}/{stats.totalSamples}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Intervals</div>
						<div className="font-mono font-bold text-sm text-gray-300">
							{data.length}
						</div>
					</div>
				</div>
			</div>

			{/* Chart */}
			<div className="bg-black/20 rounded-lg p-4 border border-gray-700/30">
				<ResponsiveContainer width="100%" height={height}>
					<BarChart data={data} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
						<defs>
							<linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#ff4444" stopOpacity={0.8}/>
								<stop offset="95%" stopColor="#ff4444" stopOpacity={0.3}/>
							</linearGradient>
							<linearGradient id="inactiveGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#00ff88" stopOpacity={0.6}/>
								<stop offset="95%" stopColor="#00ff88" stopOpacity={0.1}/>
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
							width={60}
							tick={{ fontSize: 11, fill: '#888888' }}
							axisLine={{ stroke: '#444444' }}
							tickLine={{ stroke: '#444444' }}
							domain={[0, 1]}
							ticks={[0, 1]}
							tickFormatter={(value) => value === 1 ? 'ACTIVE' : 'INACTIVE'}
						/>
						
						{/* Threshold line at 0.5 for reference */}
						<ReferenceLine 
							y={0.5} 
							stroke="#666666" 
							strokeDasharray="2 2" 
							strokeWidth={1}
							opacity={0.5}
						/>
						
						<Tooltip 
							content={<CustomTooltip />}
							cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
						/>
						
						<Bar 
							dataKey="v" 
							radius={[2, 2, 0, 0]}
							maxBarSize={40}
						>
							{data.map((entry, index) => (
								<Cell 
									key={`cell-${index}`} 
									fill={entry.v === 1 ? "url(#activeGradient)" : "url(#inactiveGradient)"}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>

			{/* Binary Status Indicator */}
			<div className="mt-4 flex items-center justify-center">
				<div className="flex items-center gap-4 text-xs">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-red-400 rounded"></div>
						<span className="text-gray-400">Active (1)</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-green-400 rounded"></div>
						<span className="text-gray-400">Inactive (0)</span>
					</div>
					<div className="text-gray-500">•</div>
					<span className="text-gray-400">2-second intervals</span>
				</div>
			</div>
		</div>
	);
}

export default BinaryBarChart;

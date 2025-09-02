"use client";

import { useMemo } from "react";
import {
	ResponsiveContainer,
	BarChart as RechartsBarChart,
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
	sensorType?: "audio" | "flame" | "binary";
};

export function BarChart({ series, height = 300, threshold, sensorType = "binary" }: Props) {
	const { data, stats } = useMemo(() => {
		// Group data into 2-second intervals
		const now = Date.now();
		const intervalMs = 2000; // 2 seconds
		const maxIntervals = 30; // Show last 30 intervals (1 minute)
		
		// Create time intervals
		const intervals: { time: string; value: number; status?: string; timestamp: number }[] = [];
		
		for (let i = maxIntervals - 1; i >= 0; i--) {
			const intervalStart = now - (i * intervalMs);
			const intervalEnd = intervalStart + intervalMs;
			
			// Find the most recent value in this interval
			const pointsInInterval = series.filter(p => 
				p.timestamp >= intervalStart && p.timestamp < intervalEnd
			);
			
			const latestPoint = pointsInInterval.length > 0 
				? pointsInInterval[pointsInInterval.length - 1]
				: null;
			
			const timeLabel = new Date(intervalStart).toLocaleTimeString([], { 
				hour: '2-digit', 
				minute: '2-digit',
				second: '2-digit'
			});
			
			intervals.push({
				time: timeLabel,
				value: latestPoint ? latestPoint.value : 0,
				status: latestPoint?.status,
				timestamp: intervalStart
			});
		}

		const values = intervals.map(i => i.value);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const avg = values.reduce((a, b) => a + b, 0) / values.length;
		const latest = values[values.length - 1];

		return {
			data: intervals,
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
			const value = payload[0].value;
			
			return (
				<div className="bg-black/90 border border-gray-600 rounded-lg p-3 backdrop-blur-sm">
					<p className="text-green-400 font-medium text-sm">{label}</p>
					<p className="text-white">
						<span className="text-gray-400">Value: </span>
						<span className="font-mono font-bold">
							{sensorType === "flame" 
								? (value === 1 ? "DETECTED" : "NONE")
								: sensorType === "audio"
								? (value === 1 ? "SOUND" : "QUIET")
								: value.toFixed(2)
							}
						</span>
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

	// Determine colors based on sensor type and values
	const getBarColor = (value: number, status?: string) => {
		if (status === 'critical') return "#ff4444";
		if (status === 'warn') return "#ffaa00";
		
		if (sensorType === "flame") {
			return value === 1 ? "#ff4444" : "#22c55e";
		} else if (sensorType === "audio") {
			return value === 1 ? "#8b5cf6" : "#22c55e";
		}
		
		// Default color logic
		if (threshold && value > threshold) return "#ff4444";
		if (threshold && value > threshold * 0.8) return "#ffaa00";
		return "#22c55e";
	};

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
							{sensorType === "flame" 
								? (stats.latest === 1 ? "DETECTED" : "NONE")
								: sensorType === "audio"
								? (stats.latest === 1 ? "SOUND" : "QUIET")
								: stats.latest?.toFixed(2) || '--'
							}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Detection Rate</div>
						<div className="font-mono font-bold text-sm text-blue-400">
							{((stats.avg * 100).toFixed(1))}%
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Range</div>
						<div className="font-mono font-bold text-sm text-gray-300">
							{stats.min?.toFixed(0)} - {stats.max?.toFixed(0)}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-400 uppercase tracking-wide mb-1">Intervals</div>
						<div className="font-mono font-bold text-sm text-gray-300">
							{stats.count}
						</div>
					</div>
				</div>
			</div>

			{/* Chart */}
			<div className="bg-black/20 rounded-lg p-4 border border-gray-700/30">
				<ResponsiveContainer width="100%" height={height}>
					<RechartsBarChart data={data} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
						<CartesianGrid 
							strokeDasharray="2 2" 
							stroke="#333333" 
							opacity={0.5}
							horizontal={true}
							vertical={false}
						/>
						
						<XAxis 
							dataKey="time" 
							minTickGap={40}
							tick={{ fontSize: 11, fill: '#888888' }}
							axisLine={{ stroke: '#444444' }}
							tickLine={{ stroke: '#444444' }}
							angle={-45}
							textAnchor="end"
							height={60}
						/>
						
						<YAxis 
							dataKey="value" 
							width={60}
							tick={{ fontSize: 11, fill: '#888888' }}
							axisLine={{ stroke: '#444444' }}
							tickLine={{ stroke: '#444444' }}
							domain={[0, Math.max(1, stats.max || 1)]}
							tickFormatter={(value) => {
								if (sensorType === "flame" || sensorType === "audio") {
									return value === 1 ? "ON" : "OFF";
								}
								return value.toString();
							}}
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
						
						<Tooltip 
							content={<CustomTooltip />}
							cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
						/>
						
						<Bar 
							dataKey="value" 
							radius={[2, 2, 0, 0]}
						>
							{data.map((entry, index) => (
								<Cell 
									key={`cell-${index}`}
									fill={getBarColor(entry.value, entry.status)}
								/>
							))}
						</Bar>
					</RechartsBarChart>
				</ResponsiveContainer>
			</div>

			{/* Legend */}
			<div className="mt-3 flex items-center justify-center gap-6 text-xs">
				{sensorType === "flame" && (
					<>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-red-400 rounded"></div>
							<span className="text-gray-400">Fire Detected</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-400 rounded"></div>
							<span className="text-gray-400">No Fire</span>
						</div>
					</>
				)}
				{sensorType === "audio" && (
					<>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-purple-400 rounded"></div>
							<span className="text-gray-400">Sound Detected</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-400 rounded"></div>
							<span className="text-gray-400">Quiet</span>
						</div>
					</>
				)}
				<div className="text-gray-500 text-xs">
					Updates every 2 seconds
				</div>
			</div>
		</div>
	);
}

export default BarChart;

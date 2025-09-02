"use client";

import RealtimeChart from "./RealtimeChart";
import type { SensorPoint } from "@/types/sensor";
import { useAlertsStore } from "@/store/alerts.store";

type Props = {
	sensorData: Record<string, {
		series: SensorPoint[];
		latest: SensorPoint | null;
		lastUpdated: number | null;
	}>;
};

// Security sensor mapping
const SECURITY_SENSORS = [
	{ id: "/esp32/light", name: "Perimeter Lighting", icon: "🔆", zone: "Outer Perimeter" },
	{ id: "/esp32/smoke", name: "Smoke Detection", icon: "🔥", zone: "Cell Block A" },
	{ id: "/esp32/sound", name: "Audio Monitoring", icon: "🔊", zone: "Common Area" },
	{ id: "/raspi/gyro", name: "Shaking Detection", icon: "📳", zone: "Entry Point" },
	{ id: "/raspi/flame", name: "Fire Detection", icon: "🚨", zone: "Kitchen Area" }
];

function getSensorInfo(sensorId: string) {
	return SECURITY_SENSORS.find(s => s.id === sensorId) || { 
		name: sensorId, 
		icon: "📊", 
		zone: "Unknown" 
	};
}

export default function MultiSensorCharts({ sensorData }: Props) {
	const { rules } = useAlertsStore();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold text-white flex items-center gap-2">
					📊 Live Multi-Sensor Monitoring
				</h2>
				<div className="flex items-center gap-2 text-sm text-gray-400">
					<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
					<span>Real-time Data Streams</span>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				{Object.entries(sensorData).map(([sensorId, data]) => {
					const sensorInfo = getSensorInfo(sensorId);
					const rule = rules[sensorId];
					const isOnline = data.latest && data.lastUpdated && (Date.now() - data.lastUpdated < 30000);
					
					return (
						<div key={sensorId} className="bg-black/30 border border-gray-700/50 rounded-lg overflow-hidden backdrop-blur-sm">
							{/* Chart Header */}
							<div className="p-4 border-b border-gray-700/50">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<span className="text-xl">{sensorInfo.icon}</span>
										<div>
											<h3 className="font-semibold text-white text-sm">{sensorInfo.name}</h3>
											<p className="text-xs text-gray-400">{sensorInfo.zone}</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										{/* Online Status */}
										<div className="flex items-center gap-2">
											<div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
											<span className="text-xs text-gray-400">
												{isOnline ? 'Live' : 'Offline'}
											</span>
										</div>

										{/* Current Value */}
										{data.latest && (
											<div className="text-right">
												<div className="text-xs text-gray-400">Current</div>
												<div className={`font-mono font-bold text-sm ${
													data.latest.status === 'critical' ? 'text-red-400' :
													data.latest.status === 'warn' ? 'text-yellow-400' :
													'text-green-400'
												}`}>
													{data.latest.value.toFixed(2)}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Chart */}
							<div className="p-4">
								{data.series.length > 0 ? (
									<RealtimeChart 
										series={data.series} 
										height={200}
										threshold={rule?.threshold}
									/>
								) : (
									<div className="h-[200px] flex items-center justify-center bg-gray-900/30 rounded-lg border border-gray-700/30">
										<div className="text-center">
											<div className="text-2xl mb-2">📊</div>
											<div className="text-gray-400 text-sm">No data available</div>
											<div className="text-gray-500 text-xs">Waiting for sensor readings...</div>
										</div>
									</div>
								)}
							</div>

							{/* Chart Footer */}
							<div className="px-4 pb-4">
								<div className="flex items-center justify-between text-xs">
									<div className="flex items-center gap-4">
										<span className="text-gray-400">
											Points: <span className="text-green-400 font-mono">{data.series.length}</span>
										</span>
										{rule && (
											<span className="text-gray-400">
												Threshold: <span className="text-yellow-400 font-mono">{rule.threshold}</span>
											</span>
										)}
									</div>
									{data.lastUpdated && (
										<span className="text-gray-500">
											Updated: {new Date(data.lastUpdated).toLocaleTimeString()}
										</span>
									)}
								</div>
							</div>

							{/* Alert Indicator */}
							{data.latest?.status === 'critical' && (
								<div className="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
							)}
						</div>
					);
				})}
			</div>

			{/* Summary Statistics */}
			<div className="bg-gray-900/30 rounded-lg border border-gray-700/50 p-4">
				<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					📈 Network Statistics
				</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="text-center">
						<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Sensors</div>
						<div className="text-2xl font-bold text-white">{Object.keys(sensorData).length}</div>
					</div>
					<div className="text-center">
						<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Online</div>
						<div className="text-2xl font-bold text-green-400">
							{Object.values(sensorData).filter(data => 
								data.latest && data.lastUpdated && (Date.now() - data.lastUpdated < 30000)
							).length}
						</div>
					</div>
					<div className="text-center">
						<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Data Points</div>
						<div className="text-2xl font-bold text-blue-400">
							{Object.values(sensorData).reduce((sum, data) => sum + data.series.length, 0)}
						</div>
					</div>
					<div className="text-center">
						<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Critical Alerts</div>
						<div className="text-2xl font-bold text-red-400">
							{Object.values(sensorData).filter(data => data.latest?.status === 'critical').length}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

"use client";

import type { SensorPoint } from "@/types/sensor";

type Row = {
	sensorId: string;
	latest?: SensorPoint | null;
	series?: SensorPoint[];
	lastUpdated?: number | null;
};

type Props = {
	rows: Row[];
};

// Security sensor mapping for display
const SECURITY_SENSORS = [
	{ id: "/esp32/light", name: "Perimeter Lighting", icon: "🔆", zone: "Outer Perimeter", type: "Environmental" },
	{ id: "/esp32/smoke", name: "Smoke Detection", icon: "🔥", zone: "Cell Block A", type: "Fire Safety" },
	{ id: "/esp32/sound", name: "Audio Monitoring", icon: "🔊", zone: "Common Area", type: "Audio Surveillance" },
	{ id: "/raspi/gyro", name: "Shaking Detection", icon: "📳", zone: "Entry Point", type: "Shaking Sensor" },
	{ id: "/raspi/flame", name: "Fire Detection", icon: "🚨", zone: "Kitchen Area", type: "Fire Safety" }
];

function getSensorInfo(sensorId: string) {
	return SECURITY_SENSORS.find(s => s.id === sensorId) || { 
		name: sensorId, 
		icon: "📊", 
		zone: "Unknown", 
		type: "Generic" 
	};
}

function SecurityStatusBadge({ status, isOnline }: { status?: string; isOnline: boolean }) {
	if (!isOnline) {
		return (
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-gray-500 border border-gray-400"></div>
				<span className="text-gray-400 text-xs font-medium uppercase tracking-wide">OFFLINE</span>
			</div>
		);
	}

	const statusConfig = {
		critical: { color: "bg-red-500", textColor: "text-red-400", label: "CRITICAL", pulseClass: "animate-pulse" },
		warn: { color: "bg-yellow-500", textColor: "text-yellow-400", label: "WARNING", pulseClass: "animate-pulse" },
		ok: { color: "bg-green-500", textColor: "text-green-400", label: "SECURE", pulseClass: "" }
	};

	const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ok;

	return (
		<div className="flex items-center gap-2">
			<div className={`w-3 h-3 rounded-full ${config.color} ${config.pulseClass} border border-white/20`}></div>
			<span className={`${config.textColor} text-xs font-medium uppercase tracking-wide`}>
				{config.label}
			</span>
		</div>
	);
}

function SecurityPriorityBadge({ type }: { type: string }) {
	const typeConfig: Record<string, { color: string; priority: string }> = {
		"Fire Safety": { color: "bg-red-500/20 text-red-300 border-red-500/30", priority: "HIGH" },
		"Audio Surveillance": { color: "bg-purple-500/20 text-purple-300 border-purple-500/30", priority: "MED" },
		"Shaking Sensor": { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", priority: "HIGH" },
		"Environmental": { color: "bg-green-500/20 text-green-300 border-green-500/30", priority: "LOW" },
		"Generic": { color: "bg-gray-500/20 text-gray-300 border-gray-500/30", priority: "LOW" }
	};

	const config = typeConfig[type] || typeConfig.Generic;

	return (
		<span className={`px-2 py-1 text-xs font-medium rounded border ${config.color} uppercase tracking-wide`}>
			{config.priority}
		</span>
	);
}

export default function SensorTable({ rows }: Props) {
	const totalSensors = rows.length;
	const onlineSensors = rows.filter(r => r.latest).length;
	const criticalAlerts = rows.filter(r => r.latest?.status === 'critical').length;
	const warningAlerts = rows.filter(r => r.latest?.status === 'warn').length;

	return (
		<div className="space-y-4">
			{/* Network Status Summary */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
				<div className="text-center">
					<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Network Status</div>
					<div className="flex items-center justify-center gap-2">
						<div className={`w-2 h-2 rounded-full ${onlineSensors === totalSensors ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
						<span className="font-mono font-bold text-sm text-white">
							{onlineSensors}/{totalSensors}
						</span>
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Critical</div>
					<div className="font-mono font-bold text-sm text-red-400">
						{criticalAlerts}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Warnings</div>
					<div className="font-mono font-bold text-sm text-yellow-400">
						{warningAlerts}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Secure</div>
					<div className="font-mono font-bold text-sm text-green-400">
						{onlineSensors - criticalAlerts - warningAlerts}
					</div>
				</div>
			</div>

			{/* Sensor Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{rows.map((row) => {
					const sensorInfo = getSensorInfo(row.sensorId);
					const isOnline = !!row.latest && !!row.lastUpdated && (Date.now() - row.lastUpdated < 30000);
					const lastUpdate = row.lastUpdated ? new Date(row.lastUpdated) : (row.latest ? new Date(row.latest.timestamp) : null);
					const timeSinceUpdate = lastUpdate ? Date.now() - lastUpdate.getTime() : null;
					const dataPoints = row.series?.length || 0;
					
					return (
						<div key={row.sensorId} className={`
							relative p-4 rounded-lg border backdrop-blur-sm transition-all duration-300
							${row.latest?.status === 'critical' ? 'bg-red-500/10 border-red-500/30 hover:border-red-400/50' :
							  row.latest?.status === 'warn' ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-400/50' :
							  isOnline ? 'bg-green-500/5 border-green-500/20 hover:border-green-400/40' :
							  'bg-gray-500/10 border-gray-500/30 hover:border-gray-400/50'}
							hover:scale-[1.02] group cursor-pointer
						`}>
							{/* Header */}
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-3">
									<span className="text-xl">{sensorInfo.icon}</span>
									<div>
										<h3 className="font-semibold text-white text-sm">{sensorInfo.name}</h3>
										<p className="text-xs text-gray-400">{sensorInfo.zone}</p>
									</div>
								</div>
								<SecurityPriorityBadge type={sensorInfo.type} />
							</div>

							{/* Status and Value */}
							<div className="grid grid-cols-2 gap-4 mb-3">
								<div>
									<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</div>
									<SecurityStatusBadge status={row.latest?.status} isOnline={isOnline} />
								</div>
								<div>
									<div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Value</div>
									<div className={`font-mono font-bold text-lg ${
										row.latest?.status === 'critical' ? 'text-red-400' :
										row.latest?.status === 'warn' ? 'text-yellow-400' :
										isOnline ? 'text-green-400' : 'text-gray-500'
									}`}>
										{row.latest ? row.latest.value.toFixed(2) : '--'}
									</div>
								</div>
							</div>

							{/* Data Statistics */}
							<div className="grid grid-cols-2 gap-4 mb-3 text-xs">
								<div>
									<span className="text-gray-400">Data Points:</span>
									<div className="text-green-400 font-mono font-bold">{dataPoints}</div>
								</div>
								<div>
									<span className="text-gray-400">Online:</span>
									<div className={`font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
										{isOnline ? 'YES' : 'NO'}
									</div>
								</div>
							</div>

							{/* Last Update */}
							<div className="flex items-center justify-between text-xs">
								<span className="text-gray-400">Last Update:</span>
								<div className="flex items-center gap-2">
									{lastUpdate && (
										<>
											<span className="text-gray-300">
												{lastUpdate.toLocaleTimeString()}
											</span>
											{timeSinceUpdate && timeSinceUpdate > 60000 && (
												<span className="text-yellow-400">
													({Math.floor(timeSinceUpdate / 60000)}m ago)
												</span>
											)}
										</>
									)}
									{!lastUpdate && (
										<span className="text-gray-500">No data</span>
									)}
								</div>
							</div>

							{/* Alert indicator for critical status */}
							{row.latest?.status === 'critical' && (
								<div className="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
							)}

							{/* Connection indicator */}
							<div className={`absolute bottom-2 left-2 w-2 h-2 rounded-full ${
								isOnline ? 'bg-green-400' : 'bg-red-400'
							}`}></div>
						</div>
					);
				})}
			</div>
		</div>
	);
}



"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAlertsStore } from "@/store/alerts.store";


const schema = z.object({
	threshold: z.number({ message: "Enter a number" }),
	op: z.enum(["gt", "lt", "gte", "lte"] as const),
	windowSec: z.number().int().min(5).max(3600),
	enabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
	sensorId: string;
};

// Security sensor mapping
const SECURITY_SENSORS = [
	{ id: "/esp32/light", name: "Perimeter Lighting", icon: "🔆", zone: "Outer Perimeter", unit: "lux" },
	{ id: "/esp32/smoke", name: "Smoke Detection", icon: "🔥", zone: "Cell Block A", unit: "ppm" },
	{ id: "/esp32/sound", name: "Audio Monitoring", icon: "🔊", zone: "Common Area", unit: "dB" },
	{ id: "/raspi/gyro", name: "Shaking Detection", icon: "📳", zone: "Entry Point", unit: "deg/s" },
	{ id: "/raspi/flame", name: "Fire Detection", icon: "🚨", zone: "Kitchen Area", unit: "level" }
];

function getSensorInfo(sensorId: string) {
	return SECURITY_SENSORS.find(s => s.id === sensorId) || { 
		name: sensorId, 
		icon: "📊", 
		zone: "Unknown",
		unit: "value"
	};
}

export default function AlertConfigPanel({ sensorId }: Props) {
	const { rules, setRule, removeRule } = useAlertsStore();
	const existing = rules[sensorId];
	const sensorInfo = getSensorInfo(sensorId);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors, isDirty },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: existing || {
			threshold: 30,
			op: "gt",
			windowSec: 60,
			enabled: true,
		},
	});

	const enabled = watch("enabled");
	const threshold = watch("threshold");
	const op = watch("op");

	useEffect(() => {
		if (existing) {
			reset(existing);
		}
	}, [existing, reset]);

	const onSubmit = (data: FormValues) => {
		setRule({ sensorId, ...data });
	};

	const operatorOptions = [
		{ value: "gt", label: "Greater Than (>)", symbol: ">" },
		{ value: "gte", label: "Greater or Equal (≥)", symbol: "≥" },
		{ value: "lt", label: "Less Than (<)", symbol: "<" },
		{ value: "lte", label: "Less or Equal (≤)", symbol: "≤" }
	];

	const getCurrentOperatorSymbol = () => {
		return operatorOptions.find(opt => opt.value === op)?.symbol || ">";
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
				<span className="text-lg">{sensorInfo.icon}</span>
				<div className="flex-1">
					<h3 className="font-semibold text-white text-sm">{sensorInfo.name}</h3>
					<p className="text-xs text-gray-400">{sensorInfo.zone}</p>
				</div>
				<div className={`px-2 py-1 rounded-full text-xs font-medium ${
					enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
				}`}>
					{enabled ? 'ARMED' : 'DISARMED'}
				</div>
			</div>

			{/* Alert Preview */}
			{enabled && threshold && (
				<div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
					<div className="text-xs text-blue-400 uppercase tracking-wide mb-1">Alert Condition</div>
					<div className="text-sm text-white font-mono">
						Trigger when value {getCurrentOperatorSymbol()} {threshold} {sensorInfo.unit}
					</div>
				</div>
			)}

			{/* Configuration Form */}
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				{/* Enable/Disable Toggle */}
				<div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
					<div>
						<div className="text-sm font-medium text-white">Alert System</div>
						<div className="text-xs text-gray-400">Enable security monitoring for this sensor</div>
					</div>
					<label className="relative inline-flex items-center cursor-pointer">
						<input 
							type="checkbox" 
							{...register("enabled")} 
							className="sr-only peer"
						/>
						<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
					</label>
				</div>

				{enabled && (
					<>
						{/* Threshold Configuration */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="block">
									<span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
										Threshold Value
									</span>
									<input 
										type="number" 
										step="0.1" 
										{...register("threshold", { valueAsNumber: true })} 
										className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent"
										placeholder="Enter threshold..."
									/>
									{errors.threshold && (
										<span className="text-xs text-red-400 mt-1 block">{errors.threshold.message}</span>
									)}
								</label>
							</div>

							<div className="space-y-2">
								<label className="block">
									<span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
										Condition
									</span>
									<select 
										{...register("op")} 
										className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent"
									>
										{operatorOptions.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
									{errors.op && (
										<span className="text-xs text-red-400 mt-1 block">{errors.op.message}</span>
									)}
								</label>
							</div>
						</div>

						{/* Window Configuration */}
						<div className="space-y-2">
							<label className="block">
								<span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
									Evaluation Window
								</span>
								<div className="flex items-center gap-2 mt-1">
									<input 
										type="number" 
										min="5"
										max="3600"
										{...register("windowSec", { valueAsNumber: true })} 
										className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent"
									/>
									<span className="text-gray-400 text-sm">seconds</span>
								</div>
								<div className="text-xs text-gray-500 mt-1">
									Alert triggers when condition is met within this time window
								</div>
								{errors.windowSec && (
									<span className="text-xs text-red-400 mt-1 block">{errors.windowSec.message}</span>
								)}
							</label>
						</div>
					</>
				)}

				{/* Action Buttons */}
				<div className="flex gap-3 pt-4 border-t border-gray-700/50">
					<button 
						type="button" 
						onClick={() => removeRule(sensorId)}
						className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-600/50 transition-colors"
					>
						🗑️ Remove Rule
					</button>
					<button 
						type="submit" 
						disabled={!isDirty}
						className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
							isDirty 
								? 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400' 
								: 'bg-gray-600 text-gray-400 cursor-not-allowed'
						}`}
					>
						💾 Save Configuration
					</button>
				</div>
			</form>

			{/* Info Panel */}
			<div className="p-3 bg-gray-900/20 rounded-lg border border-gray-700/30">
				<div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Security Guidelines</div>
				<ul className="text-xs text-gray-500 space-y-1">
					<li>• Critical alerts require immediate attention</li>
					<li>• Shorter windows provide faster detection</li>
					<li>• Set thresholds based on normal operating ranges</li>
					<li>• Test configurations during maintenance windows</li>
				</ul>
			</div>
		</div>
	);
}



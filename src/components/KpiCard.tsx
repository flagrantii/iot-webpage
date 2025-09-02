"use client";

type Props = {
	title: string;
	value: string | number;
	subtitle?: string;
	status?: "operational" | "alert" | "secure" | "info" | "warning" | "critical";
	icon?: string;
	subtle?: string; // Keep for backward compatibility
};

const statusConfig = {
	operational: {
		bgColor: "bg-green-500/10",
		borderColor: "border-green-500/30",
		textColor: "text-green-400",
		glowColor: "shadow-green-500/20"
	},
	secure: {
		bgColor: "bg-green-500/10",
		borderColor: "border-green-500/30",
		textColor: "text-green-400",
		glowColor: "shadow-green-500/20"
	},
	alert: {
		bgColor: "bg-red-500/10",
		borderColor: "border-red-500/30",
		textColor: "text-red-400",
		glowColor: "shadow-red-500/20"
	},
	critical: {
		bgColor: "bg-red-500/10",
		borderColor: "border-red-500/30",
		textColor: "text-red-400",
		glowColor: "shadow-red-500/20"
	},
	warning: {
		bgColor: "bg-yellow-500/10",
		borderColor: "border-yellow-500/30",
		textColor: "text-yellow-400",
		glowColor: "shadow-yellow-500/20"
	},
	info: {
		bgColor: "bg-blue-500/10",
		borderColor: "border-blue-500/30",
		textColor: "text-blue-400",
		glowColor: "shadow-blue-500/20"
	}
};

export default function KpiCard({ title, value, subtitle, status = "info", icon, subtle }: Props) {
	const config = statusConfig[status];
	const displaySubtitle = subtitle || subtle;
	
	return (
		<div className={`
			relative p-4 rounded-lg border backdrop-blur-sm 
			transition-all duration-300 hover:scale-105 hover:shadow-lg
			bg-black/40 border-gray-700/50 hover:border-gray-600/70
			${config.glowColor}
			group cursor-pointer
		`}>
			{/* Glow effect */}
			<div className={`
				absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 
				transition-opacity duration-300 -z-10
				${config.bgColor} ${config.borderColor}
			`} />
			
			{/* Status indicator dot */}
			<div className="flex items-start justify-between mb-2">
				<div className="flex items-center gap-2">
					{icon && <span className="text-lg">{icon}</span>}
					<div className={`w-2 h-2 rounded-full ${
						status === "alert" || status === "critical" ? 'bg-red-400 animate-pulse' :
						status === "operational" || status === "secure" ? 'bg-green-400' :
						status === "warning" ? 'bg-yellow-400' :
						'bg-blue-400'
					}`} />
				</div>
			</div>
			
			{/* Content */}
			<div className="space-y-1">
				<div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
					{title}
				</div>
				<div className={`text-2xl font-bold tracking-tight ${config.textColor}`}>
					{value}
				</div>
				{displaySubtitle && (
					<div className="text-xs text-gray-500 font-medium">
						{displaySubtitle}
					</div>
				)}
			</div>

			{/* Animated border for critical/alert status */}
			{(status === "alert" || status === "critical") && (
				<div className="absolute inset-0 rounded-lg border-2 border-red-400/50 animate-pulse pointer-events-none" />
			)}
		</div>
	);
}



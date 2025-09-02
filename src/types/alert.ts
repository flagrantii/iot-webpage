export type AlertOp = "gt" | "lt" | "gte" | "lte";
export type AlertSeverity = "warn" | "critical";

export interface AlertRule {
	sensorId: string;
	threshold: number;
	op: AlertOp;
	windowSec: number;
	enabled: boolean;
}

export interface AlertEvent {
	eventId: string;
	sensorId: string;
	value: number;
	triggeredAt: number;
	severity: AlertSeverity;
	acknowledged?: boolean;
}



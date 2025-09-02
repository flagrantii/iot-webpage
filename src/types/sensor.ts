export type SensorStatus = "ok" | "warn" | "critical";

export interface SensorPoint {
	timestamp: number;
	value: number;
	status?: SensorStatus;
}

export interface SensorMetadata {
	id: string;
	name: string;
	unit: string;
	min?: number;
	max?: number;
}

export interface LiveSensorSnapshot {
	deviceId: string;
	sensorId: string;
	data: SensorPoint;
}



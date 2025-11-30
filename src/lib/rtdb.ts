import { onValue, ref, query, limitToLast, orderByKey, type DataSnapshot } from "firebase/database";
import { getRtdb } from "@/lib/firebase";
import type { SensorPoint } from "@/types/sensor";

export type Unsubscribe = () => void;

/**
 * Generic subscription to a path in RTDB.
 * @param path The path to subscribe to (e.g. "raspi/node/flame")
 * @param transform A function that converts the raw data to a SensorPoint.
 *                  Should return null if the data is invalid.
 * @param onUpdate Callback with the new SensorPoint
 */
export function subscribeToPath(
	path: string,
	transform: (val: any) => SensorPoint | null,
	onUpdate: (point: SensorPoint) => void
): Unsubscribe {
	const db = getRtdb();
	const nodeRef = ref(db, path);
	
	const unsubscribe = onValue(nodeRef, (snap: DataSnapshot) => {
		const val = snap.val();
		if (!val) return;
		
		const point = transform(val);
		if (point) {
			onUpdate(point);
		}
	});
	
	return () => unsubscribe();
}

// --- Specific Transformers for the new JSON structure ---

// Node sensors (flame, smoke, sound) structure:
// { detect: boolean, raw: { ... }, src: string, ts: number, value: number }
export function transformNodeSensor(val: any): SensorPoint | null {
	if (!val || typeof val.value !== 'number') return null;
	// ts is in seconds float (e.g., 1764491064.09), convert to ms
	const ts = typeof val.ts === 'number' ? Math.floor(val.ts * 1000) : Date.now();
	return {
		timestamp: ts,
		value: val.value,
		status: val.detect ? "critical" : "ok" // Assuming detect=true means alert
	};
}

// PPE structure:
// { classes: { hat: number, person: number }, total: number, ts: number }
export function transformPPE(val: any, key: 'total' | 'hat' | 'person'): SensorPoint | null {
	if (!val) return null;
	const ts = typeof val.ts === 'number' ? Math.floor(val.ts * 1000) : Date.now();
	
	let value = 0;
	if (key === 'total') value = val.total ?? 0;
	else if (val.classes) value = val.classes[key] ?? 0;
	
	return {
		timestamp: ts,
		value: value,
		status: "ok"
	};
}

// DHT structure:
// { humidity_pct: number, temperature_c: number, ts: number, ... }
export function transformDHT(val: any, key: 'temp' | 'humid'): SensorPoint | null {
	if (!val) return null;
	const ts = typeof val.ts === 'number' ? Math.floor(val.ts * 1000) : Date.now();
	
	let value = 0;
	if (key === 'temp') value = val.temperature_c ?? 0;
	else if (key === 'humid') value = val.humidity_pct ?? 0;

	return {
		timestamp: ts,
		value: value,
		status: "ok" // status logic can be added in the store/alert system
	};
}

// Gyro structure:
// { magnitude: number, is_shaking: boolean, ts: number, ... }
export function transformGyro(val: any): SensorPoint | null {
	if (!val || typeof val.magnitude !== 'number') return null;
	const ts = typeof val.ts === 'number' ? Math.floor(val.ts * 1000) : Date.now();
	
	return {
		timestamp: ts,
		value: val.magnitude,
		status: val.is_shaking ? "warn" : "ok"
	};
}

// Helper for history (if needed, currently generic)
export function subscribeSensorHistory(
	sensorId: string, // This might need adaptation if paths don't map directly to history nodes
	points: number,
	onPoint: (point: SensorPoint) => void
): Unsubscribe {
    // For now, returning no-op or we could try to query if history exists.
    // The previous implementation assumed a /history/ root which might not exist for the new structure.
    // If the new structure only has the "latest" state, we might not have history in the DB.
    // We will just return a no-op for now unless we know where history is stored.
	return () => {};
}

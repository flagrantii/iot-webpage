import { onValue, ref, type DataSnapshot } from "firebase/database";
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
	transform: (val: unknown) => SensorPoint | null,
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
export function transformNodeSensor(val: unknown): SensorPoint | null {
	if (!val || typeof (val as { value: number }).value !== 'number') return null;
	// ts is in seconds float (e.g., 1764491064.09), convert to ms
	const ts = typeof (val as { ts: number }).ts === 'number' ? Math.floor((val as { ts: number }).ts * 1000) : Date.now();
	return {
		timestamp: ts,
		value: (val as { value: number }).value,
		status: (val as { detect?: boolean }).detect ? "critical" : "ok" // Assuming detect=true means alert
	};
}

// PPE structure:
// { classes: { hat: number, person: number }, total: number, ts: number }
export function transformPPE(val: unknown, key: 'total' | 'hat' | 'person'): SensorPoint | null {
	if (!val) return null;
	const ts = typeof (val as { ts: number }).ts === 'number' ? Math.floor((val as { ts: number }).ts * 1000) : Date.now();
	
	let value = 0;
	if (key === 'total') value = (val as { total: number }).total ?? 0;
	else if ((val as { classes: Record<string, number> }).classes) value = (val as { classes: Record<string, number> }).classes[key] ?? 0;
	
	return {
		timestamp: ts,
		value: value,
		status: "ok"
	};
}

// DHT structure:
// { humidity_pct: number, temperature_c: number, ts: number, ... }
export function transformDHT(val: unknown, key: 'temp' | 'humid'): SensorPoint | null {
	if (!val) return null;
	const ts = typeof (val as { ts: number }).ts === 'number' ? Math.floor((val as { ts: number }).ts * 1000) : Date.now();
	
	let value = 0;
	if (key === 'temp') value = (val as { temperature_c: number }).temperature_c ?? 0;
	else if (key === 'humid') value = (val as { humidity_pct: number }).humidity_pct ?? 0;

	return {
		timestamp: ts,
		value: value,
		status: "ok" // status logic can be added in the store/alert system
	};
}

// Gyro structure:
// { magnitude: number, is_shaking: boolean, ts: number, ... }
export function transformGyro(val: unknown): SensorPoint | null {
	if (!val || typeof (val as { magnitude: number }).magnitude !== 'number') return null;
	const ts = typeof (val as { ts: number }).ts === 'number' ? Math.floor((val as { ts: number }).ts * 1000) : Date.now();
	
	return {
		timestamp: ts,
		value: (val as { magnitude: number }).magnitude,
		status: (val as { is_shaking: boolean }).is_shaking ? "warn" : "ok"
	};
}

// Helper for history (if needed, currently generic)
export function subscribeSensorHistory(
): Unsubscribe {
    // For now, returning no-op or we could try to query if history exists.
    // The previous implementation assumed a /history/ root which might not exist for the new structure.
    // If the new structure only has the "latest" state, we might not have history in the DB.
    // We will just return a no-op for now unless we know where history is stored.
	return () => {};
}

import { onValue, ref, query, limitToLast, orderByKey, type DataSnapshot } from "firebase/database";
import { getRtdb } from "@/lib/firebase";
import type { SensorPoint } from "@/types/sensor";

export type Unsubscribe = () => void;

export function subscribeSensor(sensorId: string, onUpdate: (point: SensorPoint) => void): Unsubscribe {
	const db = getRtdb();
	const sensorRef = ref(db, `/sensorsLive/${sensorId}`);
	const unsubscribe = onValue(sensorRef, (snap: DataSnapshot) => {
		const val = snap.val();
		if (!val) return;
		// Assume value is { timestamp, value, status? }
		onUpdate(val as SensorPoint);
	});
	return () => unsubscribe();
}

export function subscribeSensorHistory(
	sensorId: string,
	points: number,
	onPoint: (point: SensorPoint) => void
): Unsubscribe {
	const db = getRtdb();
	const sensorRef = query(ref(db, `/history/${sensorId}`), limitToLast(points));
	const unsubscribe = onValue(sensorRef, (snap: DataSnapshot) => {
		const val = snap.val();
		if (!val) return;
		Object.values(val as Record<string, SensorPoint>).forEach((p) => onPoint(p));
	});
	return () => unsubscribe();
}

// --- Custom helpers for user's structure ---

type Esp32Key = "light" | "smoke" | "sound";

export function subscribeEsp32(key: Esp32Key, onUpdate: (point: SensorPoint) => void): Unsubscribe {
	const db = getRtdb();
	const nodeRef = ref(db, `/esp32/${key}`);
	const unsubscribe = onValue(nodeRef, (snap: DataSnapshot) => {
		const val = snap.val() as { data?: number; flag?: boolean } | null;
		if (!val || typeof val.data !== "number") return;
		onUpdate({ timestamp: Date.now(), value: val.data });
	});
	return () => unsubscribe();
}

export function subscribeRaspiGyro(onUpdate: (point: SensorPoint) => void): Unsubscribe {
	const db = getRtdb();
	const nodeRef = ref(db, `/raspi/gyro`);
	const unsubscribe = onValue(nodeRef, (snap: DataSnapshot) => {
		const val = snap.val() as { magnitude?: number; ts?: number } | null;
		if (!val || typeof val.magnitude !== "number") return;
		const tsMs = typeof val.ts === "number" ? Math.floor(val.ts * 1000) : Date.now();
		onUpdate({ timestamp: tsMs, value: val.magnitude });
	});
	return () => unsubscribe();
}

export function subscribeRaspiGyroLog(limit: number, onPoint: (point: SensorPoint) => void): Unsubscribe {
	const db = getRtdb();
	const nodeRef = query(ref(db, `/raspi/gyro_log`), orderByKey(), limitToLast(limit));
	const unsubscribe = onValue(nodeRef, (snap: DataSnapshot) => {
		const val = snap.val() as Record<string, { avg_magnitude?: number; ts?: number }> | null;
		if (!val) return;
		Object.values(val)
			.filter((v) => typeof v.avg_magnitude === "number")
			.forEach((v) => {
				const tsMs = typeof v.ts === "number" ? Math.floor(v.ts * 1000) : Date.now();
				onPoint({ timestamp: tsMs, value: v.avg_magnitude as number });
			});
	});
	return () => unsubscribe();
}

export function subscribeRaspiFlame(onUpdate: (point: SensorPoint) => void): Unsubscribe {
	const db = getRtdb();
	const nodeRef = ref(db, `/raspi/flame`);
	const unsubscribe = onValue(nodeRef, (snap: DataSnapshot) => {
		const val = snap.val() as { flame?: boolean; ts?: number } | null;
		if (!val || typeof val.flame === "undefined") return;
		const tsMs = typeof val.ts === "number" ? Math.floor(val.ts * 1000) : Date.now();
		onUpdate({ timestamp: tsMs, value: val.flame ? 1 : 0, status: val.flame ? "critical" : "ok" });
	});
	return () => unsubscribe();
}



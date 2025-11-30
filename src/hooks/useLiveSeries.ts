"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { 
	subscribeToPath, 
	subscribeSensorHistory, 
	transformNodeSensor, 
	transformPPE, 
	transformDHT, 
	transformGyro 
} from "@/lib/rtdb";
import type { SensorPoint } from "@/types/sensor";

export type TimeRange = "15m" | "1h" | "6h" | "24h";

const RANGE_TO_MS: Record<TimeRange, number> = {
	"15m": 15 * 60 * 1000,
	"1h": 60 * 60 * 1000,
	"6h": 6 * 60 * 60 * 1000,
	"24h": 24 * 60 * 60 * 1000,
};

export function useLiveSeries(sensorId: string, range: TimeRange) {
	const [series, setSeries] = useState<SensorPoint[]>([]);
	const [lastUpdated, setLastUpdated] = useState<number | null>(null);
	const bufferRef = useRef<SensorPoint[]>([]);
	const rafRef = useRef<number | null>(null);

	// Prime with recent history (if available)
	useEffect(() => {
		bufferRef.current = [];
		setSeries([]);
		// Note: History implementation depends on whether your new DB structure supports it.
		// For now, we skip history priming if not supported by the generic helper.
		const unsubscribeHistory = subscribeSensorHistory(sensorId, 200, (point) => {
			bufferRef.current.push(point);
		});
		return () => {
			if (unsubscribeHistory) unsubscribeHistory();
		};
	}, [sensorId]);

	// Live updates for different sources
	useEffect(() => {
		let unsubscribe: (() => void) | null = null;

		const handleUpdate = (point: SensorPoint) => {
			bufferRef.current.push(point);
			setLastUpdated(point.timestamp);
		};

		if (sensorId === "raspi/node/flame") {
			unsubscribe = subscribeToPath("raspi/node/flame", transformNodeSensor, handleUpdate);
		} else if (sensorId === "raspi/node/smoke") {
			unsubscribe = subscribeToPath("raspi/node/smoke", transformNodeSensor, handleUpdate);
		} else if (sensorId === "raspi/node/sound") {
			unsubscribe = subscribeToPath("raspi/node/sound", transformNodeSensor, handleUpdate);
		} else if (sensorId === "raspi/sensors/dht/temp") {
			unsubscribe = subscribeToPath("raspi/sensors/dht", (val) => transformDHT(val, 'temp'), handleUpdate);
		} else if (sensorId === "raspi/sensors/dht/humid") {
			unsubscribe = subscribeToPath("raspi/sensors/dht", (val) => transformDHT(val, 'humid'), handleUpdate);
		} else if (sensorId === "raspi/sensors/gyro") {
			unsubscribe = subscribeToPath("raspi/sensors/gyro", transformGyro, handleUpdate);
		} else if (sensorId === "raspi/ppe/total") {
			unsubscribe = subscribeToPath("raspi/ppe", (val) => transformPPE(val, 'total'), handleUpdate);
		} else if (sensorId === "raspi/ppe/hat") {
			unsubscribe = subscribeToPath("raspi/ppe", (val) => transformPPE(val, 'hat'), handleUpdate);
		} else if (sensorId === "raspi/ppe/person") {
			unsubscribe = subscribeToPath("raspi/ppe", (val) => transformPPE(val, 'person'), handleUpdate);
		}

		return () => {
			if (unsubscribe) unsubscribe();
		};
	}, [sensorId]);

	// Paint loop at 2 seconds
	useEffect(() => {
		const paint = () => {
			const now = Date.now();
			const rangeMs = RANGE_TO_MS[range];
			if (bufferRef.current.length > 0) {
				setSeries((prev) => {
					const merged = [...prev, ...bufferRef.current];
					bufferRef.current = [];
					// Filter and sort
					return merged
						.filter((p) => now - p.timestamp <= rangeMs)
						.sort((a, b) => a.timestamp - b.timestamp);
				});
			} else {
				setSeries((prev) => prev.filter((p) => now - p.timestamp <= rangeMs));
			}

			rafRef.current = window.setTimeout(paint, 2000) as unknown as number;
		};
		rafRef.current = window.setTimeout(paint, 2000) as unknown as number;
		return () => {
			if (rafRef.current) window.clearTimeout(rafRef.current);
		};
	}, [range]);

	const latest = useMemo(() => (series.length ? series[series.length - 1] : null), [series]);

	return { series, latest, lastUpdated };
}

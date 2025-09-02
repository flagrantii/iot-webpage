"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { subscribeSensor, subscribeSensorHistory, subscribeEsp32, subscribeRaspiGyro, subscribeRaspiGyroLog, subscribeRaspiFlame } from "@/lib/rtdb";
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

	// Prime with recent history (generic path) when using default sensors
	useEffect(() => {
		bufferRef.current = [];
		setSeries([]);
		let unsubscribeHistory: (() => void) | null = null;
		if (!sensorId.includes("/")) {
			unsubscribeHistory = subscribeSensorHistory(sensorId, 200, (point) => {
				bufferRef.current.push(point);
			});
		} else if (sensorId === "/raspi/gyro") {
			unsubscribeHistory = subscribeRaspiGyroLog(200, (point) => bufferRef.current.push(point));
		}
		return () => {
			if (unsubscribeHistory) unsubscribeHistory();
		};
	}, [sensorId]);

	// Live updates for different sources
	useEffect(() => {
		let unsubscribe: (() => void) | null = null;
		if (sensorId.startsWith("/esp32/")) {
			const key = sensorId.split("/").pop() as "light" | "smoke" | "sound";
			unsubscribe = subscribeEsp32(key, (point) => {
				bufferRef.current.push(point);
				setLastUpdated(point.timestamp);
			});
		} else if (sensorId === "/raspi/gyro") {
			unsubscribe = subscribeRaspiGyro((point) => {
				bufferRef.current.push(point);
				setLastUpdated(point.timestamp);
			});
		} else if (sensorId === "/raspi/flame") {
			unsubscribe = subscribeRaspiFlame((point) => {
				bufferRef.current.push(point);
				setLastUpdated(point.timestamp);
			});
		} else {
			unsubscribe = subscribeSensor(sensorId, (point) => {
				bufferRef.current.push(point);
				setLastUpdated(point.timestamp);
			});
		}
		return () => {
			if (unsubscribe) unsubscribe();
		};
	}, [sensorId]);

	// Paint loop at 2 seconds for better binary data visualization
	useEffect(() => {
		const paint = () => {
			const now = Date.now();
			const rangeMs = RANGE_TO_MS[range];
			if (bufferRef.current.length > 0) {
				setSeries((prev) => {
					const merged = [...prev, ...bufferRef.current];
					bufferRef.current = [];
					return merged.filter((p) => now - p.timestamp <= rangeMs);
				});
			} else {
				// Drop old points even if no new data arrived
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



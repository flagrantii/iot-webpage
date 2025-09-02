"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeEsp32, subscribeRaspiGyro, subscribeRaspiFlame, subscribeRaspiGyroLog } from "@/lib/rtdb";
import type { SensorPoint } from "@/types/sensor";
import { TimeRange } from "./useLiveSeries";

const RANGE_TO_MS: Record<TimeRange, number> = {
	"15m": 15 * 60 * 1000,
	"1h": 60 * 60 * 1000,
	"6h": 6 * 60 * 60 * 1000,
	"24h": 24 * 60 * 60 * 1000,
};

export type MultiSensorData = Record<string, {
	series: SensorPoint[];
	latest: SensorPoint | null;
	lastUpdated: number | null;
}>;

export function useMultiSensorLive(sensorIds: string[], range: TimeRange) {
	const [sensorData, setSensorData] = useState<MultiSensorData>({});
	const buffersRef = useRef<Record<string, SensorPoint[]>>({});
	const rafRef = useRef<number | null>(null);
	const sensorIdsKey = sensorIds.join(',');

	// Initialize buffers for all sensors
	useEffect(() => {
		const newBuffers: Record<string, SensorPoint[]> = {};
		sensorIds.forEach(id => {
			newBuffers[id] = [];
		});
		buffersRef.current = newBuffers;

		// Initialize sensor data state
		setSensorData(prevData => {
			const newData: MultiSensorData = {};
			sensorIds.forEach(id => {
				newData[id] = prevData[id] || {
					series: [],
					latest: null,
					lastUpdated: null
				};
			});
			return newData;
		});
	}, [sensorIdsKey, sensorIds]);

	// Load historical data for each sensor
	useEffect(() => {
		const unsubscribers: (() => void)[] = [];

		sensorIds.forEach(sensorId => {
			buffersRef.current[sensorId] = [];
			
			if (sensorId === "/raspi/gyro") {
				const unsub = subscribeRaspiGyroLog(200, (point) => {
					if (buffersRef.current[sensorId]) {
						buffersRef.current[sensorId].push(point);
					}
				});
				unsubscribers.push(unsub);
			}
			// Add other historical data subscriptions as needed
		});

		return () => {
			unsubscribers.forEach(unsub => unsub());
		};
	}, [sensorIdsKey, sensorIds]);

	// Subscribe to live updates for all sensors
	useEffect(() => {
		const unsubscribers: (() => void)[] = [];

		sensorIds.forEach(sensorId => {
			let unsubscribe: (() => void) | null = null;

			if (sensorId.startsWith("/esp32/")) {
				const key = sensorId.split("/").pop() as "light" | "smoke" | "sound";
				unsubscribe = subscribeEsp32(key, (point) => {
					if (buffersRef.current[sensorId]) {
						buffersRef.current[sensorId].push(point);
					}
					setSensorData(prev => ({
						...prev,
						[sensorId]: {
							...prev[sensorId],
							lastUpdated: point.timestamp
						}
					}));
				});
			} else if (sensorId === "/raspi/gyro") {
				unsubscribe = subscribeRaspiGyro((point) => {
					if (buffersRef.current[sensorId]) {
						buffersRef.current[sensorId].push(point);
					}
					setSensorData(prev => ({
						...prev,
						[sensorId]: {
							...prev[sensorId],
							lastUpdated: point.timestamp
						}
					}));
				});
			} else if (sensorId === "/raspi/flame") {
				unsubscribe = subscribeRaspiFlame((point) => {
					if (buffersRef.current[sensorId]) {
						buffersRef.current[sensorId].push(point);
					}
					setSensorData(prev => ({
						...prev,
						[sensorId]: {
							...prev[sensorId],
							lastUpdated: point.timestamp
						}
					}));
				});
			}

			if (unsubscribe) {
				unsubscribers.push(unsubscribe);
			}
		});

		return () => {
			unsubscribers.forEach(unsub => unsub());
		};
	}, [sensorIdsKey, sensorIds]);

	// Update loop to process buffered data
	useEffect(() => {
		const paint = () => {
			const now = Date.now();
			const rangeMs = RANGE_TO_MS[range];

			setSensorData(prevData => {
				const newData: MultiSensorData = {};

				sensorIds.forEach(sensorId => {
					const buffer = buffersRef.current[sensorId] || [];
					const prevSensorData = prevData[sensorId] || { series: [], latest: null, lastUpdated: null };

					if (buffer.length > 0) {
						// Merge new points with existing series
						const merged = [...prevSensorData.series, ...buffer];
						// Clear the buffer after processing
						buffersRef.current[sensorId] = [];
						// Filter by time range
						const filtered = merged.filter((p) => now - p.timestamp <= rangeMs);
						// Sort by timestamp to ensure proper ordering
						filtered.sort((a, b) => a.timestamp - b.timestamp);

						newData[sensorId] = {
							series: filtered,
							latest: filtered.length > 0 ? filtered[filtered.length - 1] : null,
							lastUpdated: prevSensorData.lastUpdated
						};
					} else {
						// No new data, just filter old points
						const filtered = prevSensorData.series.filter((p) => now - p.timestamp <= rangeMs);
						newData[sensorId] = {
							series: filtered,
							latest: filtered.length > 0 ? filtered[filtered.length - 1] : null,
							lastUpdated: prevSensorData.lastUpdated
						};
					}
				});

				return newData;
			});

			rafRef.current = window.setTimeout(paint, 250) as unknown as number;
		};

		rafRef.current = window.setTimeout(paint, 250) as unknown as number;

		return () => {
			if (rafRef.current) {
				window.clearTimeout(rafRef.current);
			}
		};
	}, [range, sensorIdsKey, sensorIds]);

	return sensorData;
}

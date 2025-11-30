"use client";

import { useEffect, useRef, useState } from "react";
import { 
	subscribeToPath, 
	transformNodeSensor, 
	transformPPE, 
	transformDHT, 
	transformGyro 
} from "@/lib/rtdb";
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

	// Initialize buffers and state
	useEffect(() => {
		const newBuffers: Record<string, SensorPoint[]> = {};
		sensorIds.forEach(id => {
			newBuffers[id] = [];
		});
		buffersRef.current = newBuffers;

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

	// Subscribe to live updates
	useEffect(() => {
		const unsubscribers: (() => void)[] = [];

		sensorIds.forEach(sensorId => {
			let unsubscribe: (() => void) | null = null;
			
			const handleUpdate = (point: SensorPoint) => {
				if (buffersRef.current[sensorId]) {
					buffersRef.current[sensorId].push(point);
				}
				// Update 'latest' and 'lastUpdated' immediately when data arrives
				setSensorData(prev => ({
					...prev,
					[sensorId]: {
						...prev[sensorId],
						latest: point,
						lastUpdated: point.timestamp
					}
				}));
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

			if (unsubscribe) {
				unsubscribers.push(unsubscribe);
			}
		});

		return () => {
			unsubscribers.forEach(unsub => unsub());
		};
	}, [sensorIdsKey, sensorIds]);

	// Data refresh loop for charts
	useEffect(() => {
		const refreshMultiSensorData = () => {
			const now = Date.now();
			const rangeMs = RANGE_TO_MS[range];

			setSensorData(prevData => {
				const newData: MultiSensorData = {};

				sensorIds.forEach(sensorId => {
					const buffer = buffersRef.current[sensorId] || [];
					const prevSensorData = prevData[sensorId] || { series: [], latest: null, lastUpdated: null };

					// Merge and Filter
					let merged = prevSensorData.series;
					if (buffer.length > 0) {
						merged = [...merged, ...buffer];
						buffersRef.current[sensorId] = []; // Clear buffer
					}
					
					const filtered = merged
						.filter((p) => now - p.timestamp <= rangeMs)
						.sort((a, b) => a.timestamp - b.timestamp);

					// We preserve 'latest' and 'lastUpdated' from previous state if no new data
					// or if filtered series is empty (data fell out of window)
					newData[sensorId] = {
						series: filtered,
						latest: prevSensorData.latest, // Keep existing latest
						lastUpdated: prevSensorData.lastUpdated // Keep existing lastUpdated
					};
				});

				return newData;
			});

			rafRef.current = window.setTimeout(refreshMultiSensorData, 2000) as unknown as number;
		};

		rafRef.current = window.setTimeout(refreshMultiSensorData, 2000) as unknown as number;

		return () => {
			if (rafRef.current) {
				window.clearTimeout(rafRef.current);
			}
		};
	}, [range, sensorIdsKey, sensorIds]);

	return sensorData;
}

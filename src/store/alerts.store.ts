"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AlertEvent, AlertRule, AlertSeverity } from "@/types/alert";

type AlertsState = {
	rules: Record<string, AlertRule>;
	events: AlertEvent[];
	setRule: (rule: AlertRule) => void;
	removeRule: (sensorId: string) => void;
	addEvent: (event: AlertEvent) => void;
	ackEvent: (eventId: string) => void;
};

export const useAlertsStore = create<AlertsState>()(
	persist(
		(set, get) => ({
			rules: {},
			events: [],
			setRule: (rule) => set((s) => ({ rules: { ...s.rules, [rule.sensorId]: rule } })),
			removeRule: (sensorId) =>
				set((s) => {
					const { [sensorId]: _omit, ...rest } = s.rules;
					return { rules: rest };
				}),
			addEvent: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 100) })),
			ackEvent: (eventId) =>
				set((s) => ({
					events: s.events.map((e) => (e.eventId === eventId ? { ...e, acknowledged: true } : e)),
				})),
		}),
		{ name: "alerts-store" }
	)
);

export function evaluateAlert(series: { timestamp: number; value: number }[], rule: AlertRule): AlertSeverity | null {
	if (!rule.enabled || series.length === 0) return null;
	const end = Date.now();
	const start = end - rule.windowSec * 1000;
	const windowSeries = series.filter((p) => p.timestamp >= start);
	if (windowSeries.length === 0) return null;
	const values = windowSeries.map((p) => p.value);
	const avg = values.reduce((a, b) => a + b, 0) / values.length;
	const hysteresis = 0.05 * Math.abs(rule.threshold);

	const compare = (op: AlertRule["op"], lhs: number, rhs: number) => {
		switch (op) {
			case "gt":
				return lhs > rhs + hysteresis;
			case "gte":
				return lhs >= rhs + hysteresis;
			case "lt":
				return lhs < rhs - hysteresis;
			case "lte":
				return lhs <= rhs - hysteresis;
		}
	};

	return compare(rule.op, avg, rule.threshold) ? (Math.abs(avg - rule.threshold) > 2 * hysteresis ? "critical" : "warn") : null;
}



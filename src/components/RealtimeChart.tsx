"use client";

import { useMemo } from "react";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
} from "recharts";
import type { SensorPoint } from "@/types/sensor";

type Props = {
	series: SensorPoint[];
	height?: number;
};

export function RealtimeChart({ series, height = 240 }: Props) {
	const data = useMemo(
		() =>
			series.map((p) => ({
				t: new Date(p.timestamp).toLocaleTimeString(),
				v: p.value,
			})),
		[series]
	);

	return (
		<div className="w-full">
			<ResponsiveContainer width="100%" height={height}>
				<AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
					<XAxis dataKey="t" minTickGap={24} />
					<YAxis dataKey="v" width={40} />
					<Tooltip formatter={(value) => [value as number, "Value"]} labelFormatter={(label) => `${label}`} />
					<Area type="monotone" dataKey="v" stroke="#8884d8" fill="#8884d8" fillOpacity={0.25} />
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}

export default RealtimeChart;



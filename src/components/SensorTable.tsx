"use client";

import type { SensorPoint } from "@/types/sensor";

type Row = {
	sensorId: string;
	latest?: SensorPoint | null;
};

type Props = {
	rows: Row[];
};

function StatusBadge({ status }: { status?: string }) {
	const color = status === "critical" ? "bg-red-500" : status === "warn" ? "bg-yellow-500" : "bg-green-500";
	return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function SensorTable({ rows }: Props) {
	return (
		<div className="overflow-x-auto border rounded-lg">
			<table className="min-w-full text-sm">
				<thead className="bg-gray-50 dark:bg-white/10">
					<tr>
						<th className="text-left px-3 py-2">Sensor</th>
						<th className="text-left px-3 py-2">Value</th>
						<th className="text-left px-3 py-2">Status</th>
						<th className="text-left px-3 py-2">Time</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr key={r.sensorId} className="border-t">
							<td className="px-3 py-2 font-medium">{r.sensorId}</td>
							<td className="px-3 py-2">{r.latest ? r.latest.value.toFixed(2) : "-"}</td>
							<td className="px-3 py-2 flex items-center gap-2">
								<StatusBadge status={r.latest?.status} />
								{r.latest?.status || "ok"}
							</td>
							<td className="px-3 py-2 text-gray-500">
								{r.latest ? new Date(r.latest.timestamp).toLocaleTimeString() : "-"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}



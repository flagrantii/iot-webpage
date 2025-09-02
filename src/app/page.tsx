"use client";

import { useEffect, useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import RealtimeChart from "@/components/RealtimeChart";
import SensorTable from "@/components/SensorTable";
import AlertConfigPanel from "@/components/AlertConfigPanel";
import { useLiveSeries, type TimeRange } from "@/hooks/useLiveSeries";
import { useAlertsStore, evaluateAlert } from "@/store/alerts.store";

const DEFAULT_SENSORS = ["/esp32/light", "/esp32/smoke", "/esp32/sound", "/raspi/gyro", "/raspi/flame"];

export default function Home() {
  const [selectedSensor, setSelectedSensor] = useState<string>(DEFAULT_SENSORS[0]);
  const [range, setRange] = useState<TimeRange>("15m");
  const { series, latest, lastUpdated } = useLiveSeries(selectedSensor, range);
  const { rules, addEvent } = useAlertsStore();

  // Simple evaluation
  const activeRule = rules[selectedSensor];
  const severity = useMemo(() => (activeRule ? evaluateAlert(series, activeRule) : null), [series, activeRule]);

  useEffect(() => {
    if (severity && latest && activeRule) {
      addEvent({
        eventId: `${selectedSensor}-${latest.timestamp}`,
        sensorId: selectedSensor,
        value: latest.value,
        triggeredAt: Date.now(),
        severity,
      });
    }
  }, [severity, latest, activeRule, selectedSensor, addEvent]);

  const kpis = [
    { title: "Total sensors", value: DEFAULT_SENSORS.length },
    { title: "Active alerts", value: severity ? 1 : 0 },
    { title: "Last update", value: lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "-" },
  ];

  return (
    <div className="min-h-screen p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Realtime Sensor Dashboard</h1>
        <div className="flex items-center gap-2">
          <select aria-label="Select sensor" value={selectedSensor} onChange={(e) => setSelectedSensor(e.target.value)} className="border rounded px-2 py-1">
            {DEFAULT_SENSORS.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <select aria-label="Select time range" value={range} onChange={(e) => setRange(e.target.value as TimeRange)} className="border rounded px-2 py-1">
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="6h">6h</option>
            <option value="24h">24h</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {kpis.map((k) => (
          <KpiCard key={k.title} title={k.title} value={k.value} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-lg p-3">
          <RealtimeChart series={series} />
        </div>
        <div>
          <AlertConfigPanel sensorId={selectedSensor} />
        </div>
      </div>
      <div className="mt-6">
        <SensorTable rows={DEFAULT_SENSORS.map((id) => ({ sensorId: id, latest: id === selectedSensor ? latest : null }))} />
      </div>
    </div>
  );
}

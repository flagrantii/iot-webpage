"use client";

import { useEffect, useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import RealtimeChart from "@/components/RealtimeChart";
import SensorTable from "@/components/SensorTable";
import AlertConfigPanel from "@/components/AlertConfigPanel";
import { useLiveSeries, type TimeRange } from "@/hooks/useLiveSeries";
import { useAlertsStore, evaluateAlert } from "@/store/alerts.store";

// Security sensor mapping with proper naming for jail monitoring
const SECURITY_SENSORS = [
  { id: "/esp32/light", name: "Perimeter Lighting", icon: "🔆", zone: "Outer Perimeter" },
  { id: "/esp32/smoke", name: "Smoke Detection", icon: "🔥", zone: "Cell Block A" },
  { id: "/esp32/sound", name: "Audio Monitoring", icon: "🔊", zone: "Common Area" },
  { id: "/raspi/gyro", name: "Motion Detection", icon: "📳", zone: "Entry Point" },
  { id: "/raspi/flame", name: "Fire Detection", icon: "🚨", zone: "Kitchen Area" }
];

const DEFAULT_SENSORS = SECURITY_SENSORS.map(s => s.id);

function getSensorInfo(sensorId: string) {
  return SECURITY_SENSORS.find(s => s.id === sensorId) || { name: sensorId, icon: "📊", zone: "Unknown" };
}

function SecurityHeader({ onlineCount, alertCount }: { onlineCount: number; alertCount: number }) {
  const currentTime = new Date().toLocaleString();
  
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              SECURITY MONITORING SYSTEM
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span>Station ID: SEC-001</span>
          <span>•</span>
          <span>{currentTime}</span>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-green-400 font-medium">{onlineCount} Sensors Online</span>
        </div>
        {alertCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-medium">{alertCount} Active Alerts</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-blue-400 font-medium">System Operational</span>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const [selectedSensor, setSelectedSensor] = useState<string>(DEFAULT_SENSORS[0]);
  const [range, setRange] = useState<TimeRange>("15m");
  const { series, latest, lastUpdated } = useLiveSeries(selectedSensor, range);
  const { rules, addEvent } = useAlertsStore();

  // Enhanced security evaluation
  const activeRule = rules[selectedSensor];
  const severity = useMemo(() => (activeRule ? evaluateAlert(series, activeRule) : null), [series, activeRule]);
  const alertCount = severity ? 1 : 0;
  const onlineCount = DEFAULT_SENSORS.length;

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

  // Enhanced KPIs for security monitoring
  const securityKpis = [
    { 
      title: "Sensor Network", 
      value: `${onlineCount}/${DEFAULT_SENSORS.length}`, 
      subtitle: "Online/Total",
      status: "operational",
      icon: "🛡️"
    },
    { 
      title: "Security Level", 
      value: alertCount > 0 ? "ALERT" : "SECURE", 
      subtitle: alertCount > 0 ? `${alertCount} Active` : "All Clear",
      status: alertCount > 0 ? "alert" : "secure",
      icon: alertCount > 0 ? "🚨" : "✅"
    },
    { 
      title: "Last Sync", 
      value: lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "---", 
      subtitle: "System Update",
      status: "info",
      icon: "🔄"
    },
    { 
      title: "Active Zone", 
      value: getSensorInfo(selectedSensor).zone, 
      subtitle: getSensorInfo(selectedSensor).name,
      status: "info",
      icon: getSensorInfo(selectedSensor).icon
    }
  ];

  const selectedSensorInfo = getSensorInfo(selectedSensor);

  return (
    <div className="min-h-screen security-grid bg-background">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <SecurityHeader onlineCount={onlineCount} alertCount={alertCount} />
        
        {/* Control Panel */}
        <div className="bg-black/20 border border-gray-700/50 rounded-lg p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm font-medium">MONITORING CONTROL:</span>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedSensorInfo.icon}</span>
                <span className="text-white font-medium">{selectedSensorInfo.name}</span>
                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                  {selectedSensorInfo.zone}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">SENSOR</label>
                <select 
                  aria-label="Select security sensor" 
                  value={selectedSensor} 
                  onChange={(e) => setSelectedSensor(e.target.value)} 
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent"
                >
                  {SECURITY_SENSORS.map((sensor) => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.icon} {sensor.name} - {sensor.zone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">TIME RANGE</label>
                <select 
                  aria-label="Select monitoring time range" 
                  value={range} 
                  onChange={(e) => setRange(e.target.value as TimeRange)} 
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent"
                >
                  <option value="15m">15 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="6h">6 Hours</option>
                  <option value="24h">24 Hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Security KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {securityKpis.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Main Monitoring Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
          {/* Live Data Visualization */}
          <div className="xl:col-span-3">
            <div className="bg-black/30 border border-gray-700/50 rounded-lg overflow-hidden backdrop-blur-sm">
              <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    📈 Live Sensor Data - {selectedSensorInfo.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${latest ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                    <span className="text-sm text-gray-400">
                      {latest ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <RealtimeChart series={series} />
              </div>
            </div>
          </div>

          {/* Alert Configuration */}
          <div className="xl:col-span-1">
            <div className="bg-black/30 border border-gray-700/50 rounded-lg overflow-hidden backdrop-blur-sm">
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  ⚙️ Alert Configuration
                </h2>
              </div>
              <div className="p-4">
                <AlertConfigPanel sensorId={selectedSensor} />
              </div>
            </div>
          </div>
        </div>

        {/* Security Sensor Overview */}
        <div className="bg-black/30 border border-gray-700/50 rounded-lg overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-gray-700/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🛡️ Security Sensor Network Status
            </h2>
          </div>
          <div className="p-4">
            <SensorTable rows={DEFAULT_SENSORS.map((id) => ({ sensorId: id, latest: id === selectedSensor ? latest : null }))} />
          </div>
        </div>
      </div>
    </div>
  );
}

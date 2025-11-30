"use client";

import { useState, useMemo } from "react";
import { useMultiSensorLive } from "@/hooks/useMultiSensorLive";
import StatCard from "@/components/StatCard";
import LiveChart from "@/components/LiveChart";
import SensorStatusCard from "@/components/SensorStatusCard";

// Sensor Definitions
const SENSORS = [
  { id: "raspi/sensors/dht/temp", name: "Temperature", icon: "🌡️", unit: "°C", group: "env" },
  { id: "raspi/sensors/dht/humid", name: "Humidity", icon: "💧", unit: "%", group: "env" },
  { id: "raspi/node/sound", name: "Noise Level", icon: "🔊", unit: "dB", group: "env" },
  { id: "raspi/node/flame", name: "Flame Detect", icon: "🔥", unit: "val", group: "safety" },
  { id: "raspi/node/smoke", name: "Smoke Detect", icon: "💨", unit: "ppm", group: "safety" },
  { id: "raspi/sensors/gyro", name: "Vibration", icon: "📳", unit: "G", group: "safety" },
  { id: "raspi/ppe/total", name: "Personnel", icon: "👷", unit: "ppl", group: "safety" },
];

const SENSOR_IDS = SENSORS.map(s => s.id);

export default function Dashboard() {
  const [selectedSensorId, setSelectedSensorId] = useState(SENSORS[0].id);
  const [timeRange, setTimeRange] = useState<"15m" | "1h">("15m");
  
  const data = useMultiSensorLive(SENSOR_IDS, timeRange);

  // Calculate Derived Stats
  const stats = useMemo(() => {
    const temp = data["raspi/sensors/dht/temp"]?.latest?.value ?? 0;
    const humid = data["raspi/sensors/dht/humid"]?.latest?.value ?? 0;
    const ppe = data["raspi/ppe/total"]?.latest?.value ?? 0;
    
    const onlineCount = SENSOR_IDS.filter(id => {
        const last = data[id]?.lastUpdated;
        return last && (Date.now() - last < 60000);
    }).length;

    return { temp, humid, ppe, onlineCount };
  }, [data]);

  const selectedSensor = SENSORS.find(s => s.id === selectedSensorId) || SENSORS[0];
  const selectedSeries = data[selectedSensorId]?.series || [];


  // Status Logic Helper
  const getStatus = (id: string, value: number): "ok" | "warn" | "critical" => {
    // Simple thresholds for demo
    if (id.includes("flame") && value > 0) return "critical";
    if (id.includes("smoke") && value > 1500) return "warn";
    if (id.includes("temp") && value > 35) return "warn";
    return "ok";
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              EcoGuard Monitor
            </h1>
            <p className="text-gray-400 text-sm mt-1">Real-time Environmental & Safety Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>System Online</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Station ID</div>
              <div className="font-mono font-medium">RASPI-01</div>
            </div>
          </div>
        </header>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Avg Temperature" 
            value={stats.temp.toFixed(1)} 
            unit="°C" 
            icon="🌡️" 
            status={stats.temp > 30 ? "warning" : "normal"}
          />
          <StatCard 
            title="Humidity" 
            value={stats.humid.toFixed(1)} 
            unit="%" 
            icon="💧" 
            status="normal"
          />
          <StatCard 
            title="Personnel on Site" 
            value={stats.ppe} 
            unit="ppl" 
            icon="👷" 
            status={stats.ppe > 0 ? "normal" : "warning"} // Warning if 0 maybe? Or normal.
          />
          <StatCard 
            title="Active Sensors" 
            value={`${stats.onlineCount}/${SENSOR_IDS.length}`} 
            icon="📡" 
            status={stats.onlineCount === SENSOR_IDS.length ? "normal" : "warning"}
          />
        </div>

        {/* Main Layout: Chart + Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[600px]">
          
          {/* Left: Main Chart (Takes 2/3) */}
          <div className="xl:col-span-2 bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col backdrop-blur-sm relative overflow-hidden">
             {/* Chart Controls */}
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white">{selectedSensor.name} History</h2>
                    <p className="text-sm text-gray-500">Real-time data stream visualization</p>
                </div>
                <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
                    {(['15m', '1h'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                timeRange === r 
                                ? 'bg-gray-700 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full">
                <LiveChart 
                    data={selectedSeries} 
                    color={selectedSensor.id.includes('flame') ? '#f43f5e' : '#10b981'}
                    unit={selectedSensor.unit}
                    title={selectedSensor.name}
                />
            </div>
          </div>

          {/* Right: Sensor Grid (Takes 1/3) */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Sensor Feed</h3>
            
            {SENSORS.map(sensor => {
                const sensorData = data[sensor.id];
                const val = sensorData?.latest?.value ?? 0;
                const status = getStatus(sensor.id, val);

                return (
                    <SensorStatusCard 
                        key={sensor.id}
                        title={sensor.name}
                        value={val}
                        unit={sensor.unit}
                        icon={sensor.icon}
                        status={status}
                        lastUpdated={sensorData?.lastUpdated || null}
                        isSelected={selectedSensorId === sensor.id}
                        onClick={() => setSelectedSensorId(sensor.id)}
                    />
                );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}


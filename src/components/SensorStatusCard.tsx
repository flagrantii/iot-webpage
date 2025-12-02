"use client";

import { LucideIcon, Settings, AlertCircle } from "lucide-react";

type Props = {
  title: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  status: "ok" | "warn" | "critical";
  lastUpdated: number | null;
  onClick?: () => void;
  onConfigClick?: () => void;
  isSelected?: boolean;
  isAlertActive?: boolean;
  threshold?: number | null;
};

export default function SensorStatusCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  status, 
  lastUpdated, 
  onClick,
  onConfigClick,
  isSelected,
  isAlertActive,
  threshold
}: Props) {
  const isOnline = lastUpdated && (Date.now() - lastUpdated < 60000);

  const statusStyles = {
    ok: "bg-gray-900/50 border-gray-800 text-white",
    warn: "bg-amber-900/20 border-amber-500/50 text-amber-200",
    critical: "bg-rose-900/20 border-rose-500/50 text-rose-200 animate-pulse-slow"
  };

  const selectedStyle = isSelected 
    ? "ring-2 ring-emerald-500 border-transparent" 
    : "hover:border-gray-600";
    
  // Override border/ring if alert is active to draw attention
  const alertStyle = isAlertActive 
    ? "ring-2 ring-red-500 animate-pulse" 
    : "";


  return (
    <div 
      onClick={onClick}
      className={`
        relative w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer group
        ${statusStyles[status]} 
        ${selectedStyle}
        ${alertStyle}
        ${!isOnline ? 'opacity-60 grayscale' : ''}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 relative">
            <Icon className="w-6 h-6" />
            {isAlertActive && (
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black animate-bounce" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium opacity-90">{title}</h4>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-xs opacity-60">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {isOnline ? 'Online' : 'Offline'}
                </div>
                {threshold !== null && threshold !== undefined && (
                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                        <Settings className="w-3 h-3 opacity-50" />
                        <span>Limit: {threshold}</span>
                    </div>
                )}
            </div>
          </div>
        </div>
        <div className="text-right mt-3">
          <div className="text-lg font-bold font-mono">
            {typeof value === 'number' ? value.toFixed(1) : value}
            <span className="text-xs ml-1 opacity-60">{unit}</span>
          </div>
           {isAlertActive && (
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-end gap-1 mt-1">
               <AlertCircle className="w-3 h-3" /> Alert
            </div>
           )}
        </div>
      </div>

      {/* Config Button - Visible on hover or if selected */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onConfigClick?.();
        }}
        className={`
            absolute top-2 right-2 p-1.5 rounded-md transition-all
            ${isSelected ? 'opacity-100 text-emerald-500 bg-emerald-500/10' : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white hover:bg-white/10'}
        `}
        title="Configure Alerts"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}

"use client";

type Props = {
  title: string;
  value: number | string;
  unit?: string;
  icon: string;
  status: "ok" | "warn" | "critical";
  lastUpdated: number | null;
  onClick?: () => void;
  isSelected?: boolean;
};

export default function SensorStatusCard({ 
  title, 
  value, 
  unit, 
  icon, 
  status, 
  lastUpdated, 
  onClick,
  isSelected 
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


  return (
    <button 
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border transition-all duration-200
        ${statusStyles[status]} 
        ${selectedStyle}
        ${!isOnline ? 'opacity-60 grayscale' : ''}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h4 className="text-sm font-medium opacity-90">{title}</h4>
            <div className="flex items-center gap-2 text-xs opacity-60">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold font-mono">
            {typeof value === 'number' ? value.toFixed(1) : value}
            <span className="text-xs ml-1 opacity-60">{unit}</span>
          </div>
        </div>
      </div>
    </button>
  );
}


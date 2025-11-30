"use client";

import { motion } from "framer-motion";

type Props = {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  status?: "normal" | "warning" | "critical";
};

export default function StatCard({ title, value, unit, icon, status = "normal" }: Props) {
  const statusColors = {
    normal: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    critical: "border-rose-500/30 bg-rose-500/5 text-rose-400",
  };

  const config = statusColors[status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm ${config}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-white">
              {value}
            </span>
            {unit && <span className="text-sm opacity-60">{unit}</span>}
          </div>
        </div>
        <div className={`p-3 rounded-lg bg-white/5 text-2xl`}>
          {icon}
        </div>
      </div>
      
      {/* Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
    </motion.div>
  );
}


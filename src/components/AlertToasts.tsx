"use client";

import { useAlertsStore } from "@/store/alerts.store";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AlertToasts() {
  const { events, ackEvent } = useAlertsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show only unacknowledged events, limit to last 3 to avoid clutter
  const activeEvents = events.filter((e) => !e.acknowledged).slice(0, 3);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {activeEvents.map((event) => (
          <motion.div
            key={event.eventId}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className={`pointer-events-auto p-4 rounded-lg shadow-lg border backdrop-blur-md flex justify-between items-start gap-3
              ${
                event.severity === "critical"
                  ? "bg-red-900/80 border-red-700 text-red-100"
                  : "bg-amber-900/80 border-amber-700 text-amber-100"
              }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">
                  {event.severity === "critical" ? "🚨" : "⚠️"}
                </span>
                <h4 className="font-semibold capitalize text-sm">
                  {event.severity} Alert
                </h4>
                <span className="text-xs opacity-70 ml-auto">
                  {new Date(event.triggeredAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm opacity-90 truncate">
                Sensor: <span className="font-mono">{event.sensorId.split('/').pop()}</span>
              </p>
              <p className="text-sm font-mono mt-1">
                Value: {event.value.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => ackEvent(event.eventId)}
              className="text-xs uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/20 hover:bg-black/30 transition-colors"
            >
              Ack
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}


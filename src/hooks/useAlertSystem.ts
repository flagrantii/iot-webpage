import { useEffect, useRef } from "react";
import { useAlertsStore, evaluateAlert } from "@/store/alerts.store";
import { SensorPoint } from "@/types/sensor";
import { ALERT_DEFAULTS, GENERIC_DEFAULT } from "@/config/alert-defaults";
import { AlertRule } from "@/types/alert";

type SensorDataMap = Record<string, { series: SensorPoint[] }>;

export function useAlertSystem(data: SensorDataMap) {
  const { rules, addEvent } = useAlertsStore();
  // Keep track of the last triggered state to avoid spamming events
  // Map sensorId -> last severity (or null if normal)
  const alertStateRef = useRef<Record<string, "warn" | "critical" | null>>({});

  useEffect(() => {
    const now = Date.now();
    
    // Iterate over all sensors that we have data for
    Object.keys(data).forEach((sensorId) => {
      const sensorData = data[sensorId];
      if (!sensorData || !sensorData.series) return;

      // Determine the effective rule: custom rule > default rule > generic default
      let rule: AlertRule;

      if (rules[sensorId]) {
        rule = rules[sensorId];
      } else {
        const defaults = ALERT_DEFAULTS[sensorId] || GENERIC_DEFAULT;
        rule = {
          sensorId,
          threshold: defaults.threshold ?? GENERIC_DEFAULT.threshold,
          op: defaults.op ?? GENERIC_DEFAULT.op,
          windowSec: defaults.windowSec ?? GENERIC_DEFAULT.windowSec,
          enabled: defaults.enabled ?? GENERIC_DEFAULT.enabled,
        };
      }

      if (!rule.enabled) return;

      const severity = evaluateAlert(sensorData.series, rule);
      const lastSeverity = alertStateRef.current[rule.sensorId];

      // State transition: Normal -> Alert (Warn/Critical)
      if (severity && severity !== lastSeverity) {
        addEvent({
          eventId: `${rule.sensorId}-${now}`,
          sensorId: rule.sensorId,
          value: sensorData.series[sensorData.series.length - 1]?.value ?? 0,
          triggeredAt: now,
          severity: severity,
          acknowledged: false,
        });
        alertStateRef.current[rule.sensorId] = severity;
      }
      // State transition: Alert -> Normal
      else if (!severity && lastSeverity) {
        // Optional: We could log a "resolved" event if the type supported it
        alertStateRef.current[rule.sensorId] = null;
      }
      // State transition: Severity Change (Warn <-> Critical)
      else if (severity && lastSeverity && severity !== lastSeverity) {
         addEvent({
          eventId: `${rule.sensorId}-${now}`,
          sensorId: rule.sensorId,
          value: sensorData.series[sensorData.series.length - 1]?.value ?? 0,
          triggeredAt: now,
          severity: severity,
          acknowledged: false,
        });
        alertStateRef.current[rule.sensorId] = severity;
      }
    });
  }, [data, rules, addEvent]);
}

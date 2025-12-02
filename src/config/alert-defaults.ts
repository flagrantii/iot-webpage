import type { AlertRule } from "@/types/alert";

// Default configuration for sensor alerts
export const ALERT_DEFAULTS: Record<string, Partial<AlertRule>> = {
  "raspi/sensors/dht/temp": {
    threshold: 30,
    op: "gt",
    windowSec: 5,
    enabled: true,
  },
  "raspi/sensors/dht/humid": {
    threshold: 70,
    op: "gt",
    windowSec: 10,
    enabled: false,
  },
  "raspi/node/sound": {
    threshold: 80,
    op: "gt",
    windowSec: 3,
    enabled: true,
  },
  "raspi/node/flame": {
    threshold: 0,
    op: "gt",
    windowSec: 1,
    enabled: true,
  },
  "raspi/node/smoke": {
    threshold: 1500,
    op: "gt",
    windowSec: 5,
    enabled: true,
  },
  "raspi/sensors/gyro": {
    threshold: 2,
    op: "gt",
    windowSec: 2,
    enabled: false,
  },
};

// Fallback if sensor ID not found in defaults
export const GENERIC_DEFAULT: Omit<AlertRule, "sensorId"> = {
  threshold: 0,
  op: "gt",
  windowSec: 5,
  enabled: false,
};


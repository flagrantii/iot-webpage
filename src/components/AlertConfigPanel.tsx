"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAlertsStore } from "@/store/alerts.store";
import { AlertOp, AlertRule } from "@/types/alert";
import { useEffect } from "react";
import { ALERT_DEFAULTS, GENERIC_DEFAULT } from "@/config/alert-defaults";
import { X, Bell, BellOff, Trash2, Save, AlertTriangle } from "lucide-react";

const schema = z.object({
  threshold: z.number().min(-1000).max(10000),
  op: z.enum(["gt", "lt", "gte", "lte"] as const),
  windowSec: z.number().min(1).max(3600),
  enabled: z.boolean(),
});

type FormSchema = z.infer<typeof schema>;

interface AlertConfigPanelProps {
  sensorId: string;
  sensorName: string;
  onClose: () => void;
}

export default function AlertConfigPanel({ sensorId, sensorName, onClose }: AlertConfigPanelProps) {
  const { rules, setRule, removeRule } = useAlertsStore();
  const existingRule = rules[sensorId];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      threshold: existingRule?.threshold ?? 0,
      op: existingRule?.op ?? "gt",
      windowSec: existingRule?.windowSec ?? 5,
      enabled: existingRule?.enabled ?? false,
    },
  });

  const isEnabled = watch("enabled");

  useEffect(() => {
    if (existingRule) {
      reset({
        threshold: existingRule.threshold,
        op: existingRule.op,
        windowSec: existingRule.windowSec,
        enabled: existingRule.enabled,
      });
    } else {
      const defaults = ALERT_DEFAULTS[sensorId] || GENERIC_DEFAULT;
      reset({
        threshold: defaults.threshold ?? GENERIC_DEFAULT.threshold,
        op: defaults.op ?? GENERIC_DEFAULT.op,
        windowSec: defaults.windowSec ?? GENERIC_DEFAULT.windowSec,
        enabled: defaults.enabled ?? GENERIC_DEFAULT.enabled,
      });
    }
  }, [sensorId, existingRule, reset]);

  const onSubmit = (data: FormSchema) => {
    const newRule: AlertRule = {
      sensorId,
      threshold: data.threshold,
      op: data.op,
      windowSec: data.windowSec,
      enabled: data.enabled,
    };
    setRule(newRule);
    onClose();
  };

  const handleRemove = () => {
    removeRule(sensorId);
    onClose();
  };

  const opOptions: { value: AlertOp; label: string; symbol: string }[] = [
    { value: "gt", label: "Greater Than", symbol: ">" },
    { value: "gte", label: "Greater or Equal", symbol: "≥" },
    { value: "lt", label: "Less Than", symbol: "<" },
    { value: "lte", label: "Less or Equal", symbol: "≤" },
  ];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <AlertTriangle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Alert Configuration</h3>
            <p className="text-sm text-gray-400 mt-0.5">{sensorName}</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          aria-label="Close alert configuration"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Enable Toggle - Enhanced */}
        <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <Bell className="w-5 h-5 text-emerald-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <label className="text-sm font-semibold text-white cursor-pointer">
                  Alert Monitoring
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isEnabled ? "Active - System will notify on threshold breach" : "Disabled - No alerts will be sent"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("enabled")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Threshold & Operator - Enhanced */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-300">Trigger Condition</label>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-2">Operator</label>
              <select
                {...register("op")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              >
                {opOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.symbol} {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-2">Threshold Value</label>
              <input
                type="number"
                step="any"
                {...register("threshold", { valueAsNumber: true })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-mono"
                placeholder="Enter value..."
              />
              {errors.threshold && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.threshold.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Window - Enhanced */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Time Window (seconds)
          </label>
          <div className="relative">
            <input
              type="number"
              {...register("windowSec", { valueAsNumber: true })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-mono"
              placeholder="Duration in seconds..."
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Alert triggers only if condition persists for this duration</span>
          </p>
          {errors.windowSec && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errors.windowSec.message}
            </p>
          )}
        </div>

        {/* Action Buttons - Enhanced */}
        <div className="flex gap-3 pt-4 border-t border-gray-800">
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
          {existingRule && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              title="Remove alert rule"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

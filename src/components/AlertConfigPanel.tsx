"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAlertsStore } from "@/store/alerts.store";
import { AlertOp, AlertRule } from "@/types/alert";
import { useEffect } from "react";
import { ALERT_DEFAULTS, GENERIC_DEFAULT } from "@/config/alert-defaults";

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
    setValue,
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

  const opOptions: { value: AlertOp; label: string }[] = [
    { value: "gt", label: "> Greater Than" },
    { value: "gte", label: ">= Greater/Equal" },
    { value: "lt", label: "< Less Than" },
    { value: "lte", label: "<= Less/Equal" },
  ];

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-lg p-6 max-w-md w-full backdrop-blur-md shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Alert Config: {sensorName}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Enable Toggle */}
        <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-md">
          <label className="text-sm font-medium text-gray-300">Enable Alert</label>
          <input
            type="checkbox"
            {...register("enabled")}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
          />
        </div>

        {/* Threshold & Operator */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Operator</label>
            <select
              {...register("op")}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              {opOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Threshold</label>
            <input
              type="number"
              step="any"
              {...register("threshold", { valueAsNumber: true })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            {errors.threshold && <p className="text-red-400 text-xs mt-1">{errors.threshold.message}</p>}
          </div>
        </div>

        {/* Window */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Rolling Window (Seconds)
            <span className="ml-2 text-gray-600 text-[10px]">Min duration to trigger</span>
          </label>
          <input
            type="number"
            {...register("windowSec", { valueAsNumber: true })}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
           {errors.windowSec && <p className="text-red-400 text-xs mt-1">{errors.windowSec.message}</p>}
        </div>

        <div className="flex gap-3 mt-6 pt-2 border-t border-gray-800">
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Save Rule
          </button>
          {existingRule && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md text-sm font-medium transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}


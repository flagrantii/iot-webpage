"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAlertsStore } from "@/store/alerts.store";
import type { AlertOp } from "@/types/alert";

const schema = z.object({
	threshold: z.number({ invalid_type_error: "Enter a number" }),
	op: z.enum(["gt", "lt", "gte", "lte"] as const),
	windowSec: z.number().int().min(5).max(3600),
	enabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
	sensorId: string;
};

export default function AlertConfigPanel({ sensorId }: Props) {
	const { rules, setRule, removeRule } = useAlertsStore();
	const existing = rules[sensorId];

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: existing || {
			threshold: 30,
			op: "gt",
			windowSec: 60,
			enabled: true,
		},
	});

	useEffect(() => {
		if (existing) {
			reset(existing);
		}
	}, [existing, reset]);

	const onSubmit = (data: FormValues) => {
		setRule({ sensorId, ...data });
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 p-3 border rounded-md">
			<div className="col-span-2 font-medium">Alert Config</div>
			<label className="flex flex-col gap-1">
				<span className="text-sm">Threshold</span>
				<input type="number" step="any" {...register("threshold", { valueAsNumber: true })} className="px-2 py-1 border rounded" />
				{errors.threshold && <span className="text-xs text-red-500">{errors.threshold.message}</span>}
			</label>
			<label className="flex flex-col gap-1">
				<span className="text-sm">Operator</span>
				<select {...register("op")} className="px-2 py-1 border rounded">
					<option value="gt">&gt;</option>
					<option value="gte">≥</option>
					<option value="lt">&lt;</option>
					<option value="lte">≤</option>
				</select>
				{errors.op && <span className="text-xs text-red-500">{errors.op.message}</span>}
			</label>
			<label className="flex flex-col gap-1">
				<span className="text-sm">Window (sec)</span>
				<input type="number" {...register("windowSec", { valueAsNumber: true })} className="px-2 py-1 border rounded" />
				{errors.windowSec && <span className="text-xs text-red-500">{errors.windowSec.message}</span>}
			</label>
			<label className="flex items-center gap-2">
				<input type="checkbox" {...register("enabled")} />
				<span className="text-sm">Enabled</span>
			</label>
			<div className="col-span-2 flex gap-2 justify-end">
				<button type="button" className="px-3 py-1 rounded border" onClick={() => removeRule(sensorId)}>
					Remove
				</button>
				<button type="submit" className="px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black">
					Save
				</button>
			</div>
		</form>
	);
}



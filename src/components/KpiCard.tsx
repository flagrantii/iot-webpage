"use client";

type Props = {
	title: string;
	value: string | number;
	subtle?: string;
};

export default function KpiCard({ title, value, subtle }: Props) {
	return (
		<div className="p-4 rounded-lg border bg-white/60 dark:bg-black/20 backdrop-blur-sm transition-transform hover:-translate-y-0.5">
			<div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
			<div className="text-2xl font-semibold">{value}</div>
			{subtle && <div className="text-xs text-gray-500 mt-1">{subtle}</div>}
		</div>
	);
}



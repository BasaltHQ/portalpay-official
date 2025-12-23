"use client";

import React from "react";

type Props = {
	steps: string[];
	storageKey?: string;
	title?: string;
	className?: string;
};

export default function InteractiveChecklist({ steps, storageKey = "checklist:default", title = "Step-by-step Checklist", className = "" }: Props) {
	const [checked, setChecked] = React.useState<boolean[]>(() => steps.map(() => false));
	const mountedRef = React.useRef(false);

	React.useEffect(() => {
		if (mountedRef.current) return; // hydrate once
		mountedRef.current = true;
		try {
			const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
			if (raw) {
				const arr = JSON.parse(raw);
				if (Array.isArray(arr) && arr.length === steps.length) {
					setChecked(arr.map(Boolean));
				}
			}
		} catch {}
	}, [storageKey, steps.length]);

	React.useEffect(() => {
		try {
			if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(checked));
		} catch {}
	}, [checked, storageKey]);

	const completed = checked.filter(Boolean).length;
	const pct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

	function toggleIndex(idx: number) {
		setChecked(prev => prev.map((v, i) => (i === idx ? !v : v)));
	}

	function resetAll() {
		setChecked(steps.map(() => false));
	}

	return (
		<div className={`rounded-md border p-4 bg-background/60 ${className}`}>
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-semibold">{title}</h3>
				<button
					className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-foreground/5"
					onClick={resetAll}
					title="Reset checklist"
					aria-label="Reset checklist"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
						<polyline points="1 4 1 10 7 10" />
						<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
					</svg>
					<span>Reset</span>
				</button>
			</div>
			<div className="h-1.5 w-full bg-foreground/10 rounded overflow-hidden mb-3">
				<div className="h-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
			</div>
			<ul className="space-y-2">
				{steps.map((step, idx) => (
					<li key={idx} className="flex items-start gap-3">
						<button
							onClick={() => toggleIndex(idx)}
							className={`mt-0.5 inline-flex w-5 h-5 items-center justify-center rounded border ${checked[idx] ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-background"}`}
							aria-pressed={checked[idx] ? "true" : "false"}
							aria-label={`Mark step ${idx + 1} ${checked[idx] ? "incomplete" : "complete"}`}
						>
							{checked[idx] ? (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							) : (
								<span className="block w-2.5 h-2.5 rounded-sm" />
							)}
						</button>
						<div className={`text-sm ${checked[idx] ? "line-through opacity-70" : ""}`}>{step}</div>
					</li>
				))}
			</ul>
			<div className="mt-3 text-xs text-muted-foreground">{completed}/{steps.length} completed ({pct}%)</div>
		</div>
	);
}



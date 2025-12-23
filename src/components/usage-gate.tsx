"use client";

import { useEffect, useRef, useState } from "react";
import { addUsageSeconds, getUsedSecondsToday, isAllowedToStart, getPlan, setPlan } from "@/lib/usage";

export function UsageGate({
	children,
	className,
}: {
	children: (controls: { canStart: boolean; start: () => void; stop: () => void; status: string; usedSecs: number; plan: string; setPlanLocal: (p: any) => void }) => React.ReactNode;
	className?: string;
}) {
	const [status, setStatus] = useState("");
	const [canStart, setCanStart] = useState(false);
	const [usedSecs, setUsedSecs] = useState(0);
	const [plan, setPlanState] = useState(getPlan());
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const { allowed, reason } = isAllowedToStart();
		setCanStart(allowed);
		setStatus(allowed ? "" : (reason || ""));
		setUsedSecs(getUsedSecondsToday());
		setPlanState(getPlan());
	}, []);

	useEffect(() => {
		const i = setInterval(() => setUsedSecs(getUsedSecondsToday()), 2000);
		return () => clearInterval(i);
	}, []);

	function start() {
		const check = isAllowedToStart();
		if (!check.allowed) { setStatus(check.reason || "Not allowed"); return; }
		if (timerRef.current) return;
		setStatus("Running");
		timerRef.current = setInterval(() => addUsageSeconds(1), 1000);
	}
	function stop() {
		if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
		setStatus("");
		setUsedSecs(getUsedSecondsToday());
		setCanStart(isAllowedToStart().allowed);
	}
	function setPlanLocal(p: any) { setPlan(p); setPlanState(p); setCanStart(isAllowedToStart().allowed); }

	return <div className={className}>{children({ canStart, start, stop, status, usedSecs, plan, setPlanLocal })}</div>;
}

"use client";

const BASIC_DAILY_MINUTES = 15;

export type Plan = "none" | "basic" | "unlimited";

function getTodayKey() {
	const d = new Date();
	return d.toISOString().slice(0, 10);
}

function getNow(): number { return Date.now(); }

function getExpiry(): number {
	if (typeof window === "undefined") return 0;
	return Number(localStorage.getItem("cb.plan.expiry") || "0");
}

function setExpiry(ts: number) {
	if (typeof window === "undefined") return;
	localStorage.setItem("cb.plan.expiry", String(ts));
}

export function getPlan(): Plan {
	if (typeof window === "undefined") return "none";
	const exp = getExpiry();
	if (exp && getNow() > exp) {
		localStorage.setItem("cb.plan", "none");
	}
	return (localStorage.getItem("cb.plan") as Plan) || "none";
}

export function setPlan(plan: Plan) {
	if (typeof window === "undefined") return;
	localStorage.setItem("cb.plan", plan);
}

export function activatePlan(plan: Exclude<Plan, "none">, months = 1) {
	const now = getNow();
	const days = 30 * months; // simple month length approximation
	const exp = now + days * 24 * 60 * 60 * 1000;
	setPlan(plan);
	setExpiry(exp);
}

export function addUsageSeconds(seconds: number) {
	if (typeof window === "undefined") return;
	const key = `cb.usage.${getTodayKey()}`;
	const current = Number(localStorage.getItem(key) || "0");
	localStorage.setItem(key, String(current + Math.max(0, Math.floor(seconds))));
}

export function getUsedSecondsToday(): number {
	if (typeof window === "undefined") return 0;
	const key = `cb.usage.${getTodayKey()}`;
	return Number(localStorage.getItem(key) || "0");
}

export function isAllowedToStart(): { allowed: boolean; reason?: string } {
	const plan = getPlan();
	if (plan === "unlimited") return { allowed: true };
	if (plan !== "basic") return { allowed: false, reason: "No active plan" };
	const used = getUsedSecondsToday();
	const limit = BASIC_DAILY_MINUTES * 60;
	if (used >= limit) return { allowed: false, reason: "Daily limit reached" };
	return { allowed: true };
}

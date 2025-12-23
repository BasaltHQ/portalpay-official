// No-op environment loader. Next.js handles env injection; avoid bundler resolving optional deps.
export function loadEnv(): void {
  // intentionally empty
}

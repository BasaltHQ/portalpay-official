// Minimal no-op database connection for build/runtime environments without Mongo/Cosmos.
// Real implementation is disabled; this stub satisfies imports like `connectDB()`.

export async function connectDB(): Promise<void> {
  // No-op: skip DB connection in this environment
  return;
}

export async function testConnection(): Promise<{ success: boolean; message?: string }> {
  return { success: true, message: "DB stub active" };
}

/**
 * Redis-backed hourly rate limiter — safe across multiple workers/instances.
 *
 * Key: `rate:sender:<senderId>:<YYYY-MM-DD-HH>`
 * Uses a Lua script for atomic check+increment.
 * When limit reached, returns ms until the next hour window.
 */
import IORedis from "ioredis";
import { env } from "../config/env";

function hourWindow(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${d}-${h}`;
}

function msUntilNextHour(): number {
  const now = Date.now();
  const nextHour = Math.ceil(now / 3_600_000) * 3_600_000;
  return nextHour - now + 1000;
}

export class RateLimiter {
  private redis: IORedis;
  private maxPerHourGlobal: number;
  private maxPerHourPerSender: number;

  constructor(redis: IORedis) {
    this.redis = redis;
    this.maxPerHourGlobal = env.worker.maxEmailsPerHour;
    this.maxPerHourPerSender = env.worker.maxEmailsPerHourPerSender;
  }

  private senderKey(senderId: string): string {
    return `rate:sender:${senderId}:${hourWindow()}`;
  }

  private globalKey(): string {
    return `rate:global:${hourWindow()}`;
  }

  async consume(senderId: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const luaScript = `
      local senderCount = tonumber(redis.call('GET', KEYS[1])) or 0
      local globalCount = tonumber(redis.call('GET', KEYS[2])) or 0
      if senderCount >= tonumber(ARGV[1]) then return -1 end
      if globalCount >= tonumber(ARGV[2]) then return -2 end
      redis.call('INCR', KEYS[1])
      redis.call('EXPIRE', KEYS[1], 7200)
      redis.call('INCR', KEYS[2])
      redis.call('EXPIRE', KEYS[2], 7200)
      return 1
    `;

    const result = (await this.redis.eval(
      luaScript,
      2,
      this.senderKey(senderId),
      this.globalKey(),
      String(this.maxPerHourPerSender),
      String(this.maxPerHourGlobal)
    )) as number;

    if (result === 1) return { allowed: true };
    return { allowed: false, retryAfterMs: msUntilNextHour() };
  }

  async getCurrentCount(senderId: string): Promise<{ sender: number; global: number }> {
    const [s, g] = await Promise.all([
      this.redis.get(this.senderKey(senderId)),
      this.redis.get(this.globalKey()),
    ]);
    return { sender: parseInt(s ?? "0", 10), global: parseInt(g ?? "0", 10) };
  }
}

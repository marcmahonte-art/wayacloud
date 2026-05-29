interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

export function getRateLimitReset(key: string): number {
  const current = buckets.get(key);
  if (!current || current.resetAt <= Date.now()) return 0;
  return Math.ceil((current.resetAt - Date.now()) / 1000);
}

setInterval(() => {
  const now = Date.now();
  Array.from(buckets.entries()).forEach(([key, bucket]) => {
    if (bucket.resetAt <= now) buckets.delete(key);
  });
}, 60_000);

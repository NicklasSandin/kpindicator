import assert from "node:assert/strict";
import test from "node:test";
import { rateLimit } from "../src/lib/rate-limit";

test("rate limiter rejects requests after the configured count", () => {
  const key = `test:${Date.now()}:${Math.random()}`;
  assert.equal(rateLimit(key, 2, 60_000).allowed, true);
  assert.equal(rateLimit(key, 2, 60_000).allowed, true);
  assert.equal(rateLimit(key, 2, 60_000).allowed, false);
});

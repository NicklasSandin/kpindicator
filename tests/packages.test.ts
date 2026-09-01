import assert from "node:assert/strict";
import test from "node:test";
import { PACKAGES, getPackage } from "../src/content/packages";

test("package mappings are unique", () => {
  assert.equal(new Set(PACKAGES.map((item) => item.id)).size, PACKAGES.length);
  assert.equal(new Set(PACKAGES.map((item) => item.dbType)).size, PACKAGES.length);
  assert.equal(new Set(PACKAGES.map((item) => item.stripePriceEnvVar)).size, PACKAGES.length);
  assert.equal(getPackage("market-test").priceCents, 250000);
});

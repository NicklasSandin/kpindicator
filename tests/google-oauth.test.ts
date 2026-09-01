import assert from "node:assert/strict";
import test from "node:test";

import { constantEqual, safeOAuthNext } from "../src/lib/google-oauth";

test("Google OAuth return paths stay on this origin", () => {
  assert.equal(safeOAuthNext("/dashboard"), "/dashboard");
  assert.equal(safeOAuthNext("/invite/token"), "/invite/token");
  assert.equal(safeOAuthNext("https://attacker.example"), "");
  assert.equal(safeOAuthNext("//attacker.example"), "");
});

test("OAuth state comparison rejects different values", () => {
  assert.equal(constantEqual("same-state", "same-state"), true);
  assert.equal(constantEqual("same-state", "other-state"), false);
});

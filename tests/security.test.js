import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  newToken,
  tokenHash,
} from "../server/security.js";
import { parse, tripSchema, registerSchema } from "../server/validation.js";
const trip = {
  title: "The coast",
  destination: "Goa",
  country: "India",
  startDate: "2026-11-01",
  endDate: "2026-11-05",
  status: "Upcoming",
  budget: 20000,
  currency: "INR",
  cover: "coast",
};
test("passwords use unique salts and verify only the correct password", async () => {
  const one = await hashPassword("A-safe-test-passphrase");
  const two = await hashPassword("A-safe-test-passphrase");
  assert.notEqual(one, two);
  assert.equal(await verifyPassword("A-safe-test-passphrase", one), true);
  assert.equal(await verifyPassword("incorrect-password", one), false);
});
test("sessions contain random tokens and only hashes need persistence", () => {
  const one = newToken();
  assert.equal(one.length, 64);
  assert.notEqual(one, newToken());
  assert.notEqual(tokenHash(one), one);
});
test("trip validator rejects impossible dates, reversed dates, negative budgets, and operator injection", () => {
  assert.throws(() => parse(tripSchema, { ...trip, startDate: "2026-02-31" }));
  assert.throws(() => parse(tripSchema, { ...trip, endDate: "2026-10-01" }));
  assert.throws(() => parse(tripSchema, { ...trip, budget: -1 }));
  assert.throws(() => parse(tripSchema, { ...trip, title: { $ne: null } }));
  assert.throws(() => parse(tripSchema, { ...trip, userId: "another-user" }));
  assert.equal(parse(tripSchema, trip).expenses.length, 0);
});
test("registration normalizes emails and enforces minimum password length", () => {
  assert.equal(
    parse(registerSchema, {
      name: "Explorer",
      email: "EXPLORER@example.com",
      password: "long-test-password",
    }).email,
    "explorer@example.com",
  );
  assert.throws(() =>
    parse(registerSchema, {
      name: "Explorer",
      email: "x@example.com",
      password: "short",
    }),
  );
});

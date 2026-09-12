import { test } from 'node:test';
import assert from 'node:assert/strict';
import { money, parseMoney, add, decimalString, ratioBasisPoints } from './money.ts';

test('decimal amounts use exact integer arithmetic', () => {
  assert.equal(add(parseMoney('0.1', 'USD'), parseMoney('0.2', 'USD')).amountMinor, 30n);
  assert.equal(parseMoney('10.99', 'USD').amountMinor, 1099n);
  assert.equal(decimalString(parseMoney('-0.01', 'USD')), '-0.01');
});
test('supports zero and three decimal currencies', () => {
  assert.equal(parseMoney('250', 'CLP').amountMinor, 250n);
  assert.equal(parseMoney('1.234', 'KWD').amountMinor, 1234n);
  assert.throws(() => parseMoney('1.01', 'CLP'));
});
test('rejects invalid, mixed, and overflowing money', () => {
  for (const value of ['NaN', 'Infinity', '1e3', '1,000', '1.001', '']) assert.throws(() => parseMoney(value, 'USD'));
  assert.throws(() => money(0n, 'XXX'));
  assert.throws(() => add(money(1n, 'USD'), money(1n, 'MXN')));
  assert.throws(() => money(9223372036854775808n, 'USD'));
});
test('preserves amounts above the JavaScript safe integer limit', () => {
  assert.equal(decimalString(parseMoney('90071992547409.93', 'USD')), '90071992547409.93');
  assert.equal(ratioBasisPoints(1n, 3n), 3333n);
  assert.equal(ratioBasisPoints(1n, 0n), null);
});
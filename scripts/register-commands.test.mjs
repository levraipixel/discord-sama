import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { commands } from './register-commands.mjs';

// Collects name_localizations from commands and options (not choices — those allow 100 chars).
function collectCommandAndOptionNames(items, results = []) {
  for (const item of items) {
    if (item.name_localizations) {
      for (const [locale, value] of Object.entries(item.name_localizations)) {
        results.push({ locale, value, parent: item.name });
      }
    }
    if (item.options) collectCommandAndOptionNames(item.options, results);
  }
  return results;
}

describe('register-commands', () => {
  it('all name_localizations values are between 1 and 32 characters', () => {
    const entries = collectCommandAndOptionNames(commands);
    assert.ok(entries.length > 0, 'expected at least one name_localization entry');

    for (const { locale, value, parent } of entries) {
      assert.ok(
        value.length >= 1 && value.length <= 32,
        `name_localizations[${locale}] on "${parent}" is ${value.length} chars (must be 1–32): "${value}"`
      );
    }
  });
});

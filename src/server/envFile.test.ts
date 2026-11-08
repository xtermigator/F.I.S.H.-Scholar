import { describe, it, expect } from 'vitest';
import { parseEnv, upsertEnvVar, maskSecret, isValidEnvKeyName } from './envFile';

describe('parseEnv', () => {
  it('parses assignments, ignores comments/blanks, strips quotes', () => {
    const env = parseEnv(`# comment\nGEMINI_API_KEY="abc"\n\nNOTION_API_KEY='xyz'\nBARE=1\n`);
    expect(env.GEMINI_API_KEY).toBe('abc');
    expect(env.NOTION_API_KEY).toBe('xyz');
    expect(env.BARE).toBe('1');
    expect(Object.keys(env)).not.toContain('# comment');
  });
});

describe('upsertEnvVar', () => {
  it('updates an existing key in place, preserving other lines', () => {
    const before = `# top\nGEMINI_API_KEY="old"\nNOTION_API_KEY="keep"\n`;
    const after = upsertEnvVar(before, 'GEMINI_API_KEY', 'new');
    expect(after).toContain('GEMINI_API_KEY="new"');
    expect(after).toContain('NOTION_API_KEY="keep"');
    expect(after).toContain('# top');
    // Only one line for the updated key.
    expect(after.match(/GEMINI_API_KEY=/g)).toHaveLength(1);
  });

  it('appends a new key when absent, with a trailing newline', () => {
    const after = upsertEnvVar('EXISTING="1"', 'ANAM_API_KEY', 'k');
    expect(after).toContain('EXISTING="1"');
    expect(after).toContain('ANAM_API_KEY="k"');
    expect(after.endsWith('\n')).toBe(true);
  });

  it('does not treat a commented placeholder line as the target', () => {
    const before = `# ANAM_API_KEY is optional\nOTHER="x"\n`;
    const after = upsertEnvVar(before, 'ANAM_API_KEY', 'real');
    // The comment stays; a real assignment is appended.
    expect(after).toContain('# ANAM_API_KEY is optional');
    expect(after).toContain('ANAM_API_KEY="real"');
  });

  it('round-trips through parseEnv', () => {
    const text = upsertEnvVar(upsertEnvVar('', 'A', '1'), 'B', 'two');
    const parsed = parseEnv(text);
    expect(parsed).toEqual({ A: '1', B: 'two' });
  });
});

describe('maskSecret', () => {
  it('shows only the last few characters', () => {
    expect(maskSecret('sk-1234567890')).toMatch(/7890$/);
    expect(maskSecret('sk-1234567890')).toMatch(/^•+/);
  });
  it('fully masks short values and handles empty', () => {
    expect(maskSecret('ab')).toBe('••');
    expect(maskSecret('')).toBe('');
    expect(maskSecret(undefined)).toBe('');
  });
});

describe('isValidEnvKeyName', () => {
  it('accepts UPPER_SNAKE names, rejects others', () => {
    expect(isValidEnvKeyName('ANAM_API_KEY')).toBe(true);
    expect(isValidEnvKeyName('gemini')).toBe(false);
    expect(isValidEnvKeyName('BAD-NAME')).toBe(false);
    expect(isValidEnvKeyName('1BAD')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils/cn';

describe('cn utility', () => {
  it('returns an empty string when no arguments are given', () => {
    expect(cn()).toBe('');
  });

  it('merges a single class string', () => {
    expect(cn('text-sm')).toBe('text-sm');
  });

  it('merges multiple class strings', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('ignores undefined and null values', () => {
    expect(cn('text-sm', undefined, null)).toBe('text-sm');
  });

  it('handles conditional classes (object syntax)', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('resolves Tailwind conflicts (last one wins)', () => {
    // twMerge resolves conflicting utilities: p-2 should override p-4
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('handles array input', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold');
  });

  it('merges mixed types correctly', () => {
    expect(cn('base', { active: true, disabled: false }, ['extra'])).toBe('base active extra');
  });
});

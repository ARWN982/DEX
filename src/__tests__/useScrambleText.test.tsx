import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrambleText } from '../public/hooks/useScrambleText';

describe('useScrambleText', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the target text when shouldScramble is false', () => {
    const { result } = renderHook(() => useScrambleText('Hello World', false));
    expect(result.current).toBe('Hello World');
  });

  it('produces scrambled output when shouldScramble is true', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useScrambleText('Hello', true));

    act(() => {
      vi.advanceTimersByTime(32);
    });

    // Should not yet be the final text (only 2 chars revealed out of 5)
    expect(result.current).not.toBe('Hello');
    expect(result.current.length).toBe(5);
  });

  it('preserves spaces during scramble', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useScrambleText('A B', true));

    act(() => {
      vi.advanceTimersByTime(16);
    });

    // Space at index 1 should still be a space
    expect(result.current[1]).toBe(' ');
  });

  it('fully resolves to target text after enough time', () => {
    vi.useFakeTimers();
    const text = 'Done';
    const { result } = renderHook(() => useScrambleText(text, true));

    // 4 characters * 16ms = 64ms needed, add buffer
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(text);
  });
});

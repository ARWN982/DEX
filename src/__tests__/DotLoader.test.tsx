import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { DotLoader } from '../public/components/shared/DotLoader';

describe('DotLoader', () => {
  it('renders 9 dots in a 3x3 grid', () => {
    const { container } = render(<DotLoader />);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid).toBeTruthy();
    expect(grid.children.length).toBe(9);
  });

  it('applies smaller dot size for sm', () => {
    const { container } = render(<DotLoader size="sm" />);
    const dot = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(dot.style.width).toBe('3px');
    expect(dot.style.height).toBe('3px');
  });

  it('applies larger dot size for md', () => {
    const { container } = render(<DotLoader size="md" />);
    const dot = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(dot.style.width).toBe('4px');
    expect(dot.style.height).toBe('4px');
  });

  it('dims the grid when dimmed prop is true', () => {
    const { container } = render(<DotLoader dimmed />);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.opacity).toBe('0.3');
  });

  it('disables animation when dimmed', () => {
    const { container } = render(<DotLoader dimmed />);
    const dot = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(dot.style.animation).toBe('none');
  });
});

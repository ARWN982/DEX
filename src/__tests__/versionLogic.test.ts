import { describe, it, expect } from 'vitest';
import { getHighestVersion, getNextVersionId, Version } from '../public/store/useVersionStore';

function makeVersions(...ids: string[]): Version[] {
  return ids.map((id) => ({
    id,
    name: `Version ${id}`,
    createdAt: new Date().toISOString(),
    isActive: false,
  }));
}

describe('getHighestVersion', () => {
  it('returns "1.0" for an empty array', () => {
    expect(getHighestVersion([])).toBe('1.0');
  });

  it('returns the only version when there is one', () => {
    expect(getHighestVersion(makeVersions('1.0'))).toBe('1.0');
  });

  it('finds the highest minor version', () => {
    expect(getHighestVersion(makeVersions('1.0', '1.1', '1.2'))).toBe('1.2');
  });

  it('finds the highest version regardless of input order', () => {
    expect(getHighestVersion(makeVersions('1.2', '1.0', '1.1'))).toBe('1.2');
  });

  it('prefers higher major over higher minor', () => {
    expect(getHighestVersion(makeVersions('1.5', '2.0', '1.9'))).toBe('2.0');
  });

  it('handles multi-digit minor versions', () => {
    expect(getHighestVersion(makeVersions('1.9', '1.10', '1.11'))).toBe('1.11');
  });

  it('handles multi-digit major versions', () => {
    expect(getHighestVersion(makeVersions('9.0', '10.0', '2.5'))).toBe('10.0');
  });
});

describe('getNextVersionId', () => {
  it('returns "1.1" for empty versions with minor bump', () => {
    expect(getNextVersionId([], false)).toBe('1.1');
  });

  it('returns "2.0" for empty versions with major bump', () => {
    expect(getNextVersionId([], true)).toBe('2.0');
  });

  it('increments the minor version by 1', () => {
    const versions = makeVersions('1.0', '1.1', '1.2');
    expect(getNextVersionId(versions, false)).toBe('1.3');
  });

  it('increments the major version and resets minor to 0', () => {
    const versions = makeVersions('1.0', '1.1');
    expect(getNextVersionId(versions, true)).toBe('2.0');
  });

  it('does not fill gaps — increments from highest', () => {
    const versions = makeVersions('1.0', '1.5');
    expect(getNextVersionId(versions, false)).toBe('1.6');
  });

  it('increments from the highest major when mixed majors exist', () => {
    const versions = makeVersions('1.0', '2.0', '1.5');
    expect(getNextVersionId(versions, false)).toBe('2.1');
  });

  it('major bump from a high major version works', () => {
    const versions = makeVersions('3.0', '3.4', '2.9');
    expect(getNextVersionId(versions, true)).toBe('4.0');
  });
});

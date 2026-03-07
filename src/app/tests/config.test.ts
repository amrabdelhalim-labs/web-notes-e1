/**
 * Config Tests
 *
 * Verifies that application-wide constants have the expected values.
 */

import {
  APP_NAME_AR,
  APP_NAME_EN,
  APP_DESCRIPTION,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/app/config';

describe('App config constants', () => {
  it('exports correct Arabic app name', () => {
    expect(APP_NAME_AR).toBe('ملاحظاتي');
  });

  it('exports correct English app name', () => {
    expect(APP_NAME_EN).toBe('My Notes');
  });

  it('exports a non-empty app description', () => {
    expect(typeof APP_DESCRIPTION).toBe('string');
    expect(APP_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it('exports default locale as "ar"', () => {
    expect(DEFAULT_LOCALE).toBe('ar');
  });

  it('exports supported locales array containing "ar" and "en"', () => {
    expect(SUPPORTED_LOCALES).toContain('ar');
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toHaveLength(2);
  });

  it('exports DEFAULT_PAGE_SIZE as 10', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(10);
  });

  it('exports MAX_PAGE_SIZE as 50', () => {
    expect(MAX_PAGE_SIZE).toBe(50);
  });

  it('MAX_PAGE_SIZE is greater than DEFAULT_PAGE_SIZE', () => {
    expect(MAX_PAGE_SIZE).toBeGreaterThan(DEFAULT_PAGE_SIZE);
  });
});

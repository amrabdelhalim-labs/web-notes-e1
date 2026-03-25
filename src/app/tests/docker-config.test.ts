import { execSync } from 'child_process';

describe('docker config validation', () => {
  it('passes scripts/check-docker-config.mjs', () => {
    // Vitest runs from the repo root in this project setup.
    const out = execSync('node scripts/check-docker-config.mjs', {
      stdio: 'pipe',
    });

    expect(out.toString()).toContain('passed');
  });
});

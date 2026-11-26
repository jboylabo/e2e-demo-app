import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

export default {
  targets: [
    {
      name: 'ios',
      // Pin a simulator so a connected physical iPhone isn't picked up.
      engine: mobile({ platform: 'ios', device: 'iPhone 17' }),
      app: {
        // Debug build installed with `pnpm exec expo run:ios --device "iPhone 17"`; it loads JS from Metro on :8081.
        bundleId: 'com.jboy422san.e2e-demo-app',
        // Start Metro before the tests (reuses one that is already running).
        command: {
          executable: 'pnpm',
          args: ['exec', 'expo', 'start', '--port', '8081'],
          reuseExisting: true,
          startupTimeout: 120_000,
          log: '.e2e/logs/metro.log',
        },
        readyUrl: 'http://localhost:8081/status',
      },
    },
  ],
  workers: 1,
} satisfies E2EConfig;

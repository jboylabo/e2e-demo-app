import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

export default {
  targets: [
    {
      name: 'ios',
      // CI sets E2E_DEVICE (simulator UDID). Locally, pin a simulator so a connected physical iPhone isn't picked up.
      engine: mobile({ platform: 'ios', device: process.env.E2E_DEVICE ?? 'iPhone 17' }),
      app: {
        // Debug build installed with `pnpm exec expo run:ios --device "iPhone 17"`; it loads JS from Metro on :8081.
        bundleId: 'com.jboy422san.e2e-demo-app',
        // Locally, start Metro for the Debug build. CI installs a Release build with the JS bundled in, so no Metro there.
        ...(process.env.CI
          ? {}
          : {
              command: {
                executable: 'pnpm',
                args: ['exec', 'expo', 'start', '--port', '8081'],
                reuseExisting: true,
                startupTimeout: 120_000,
                log: '.e2e/logs/metro.log',
              },
              readyUrl: 'http://localhost:8081/status',
            }),
      },
    },
  ],
  workers: 1,
} satisfies E2EConfig;

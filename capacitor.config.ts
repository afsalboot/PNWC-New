import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL?.trim();
const liveOrigin = serverUrl?.replace(/\/+$/, "");
const liveHostname = liveOrigin ? new URL(liveOrigin).hostname : undefined;

const config: CapacitorConfig = {
  appId: 'com.pnwc.equipment',
  appName: 'PNWC',
  webDir: 'out',
  ...(liveOrigin
    ? {
        server: {
          url: `${liveOrigin}/login`,
          cleartext: liveOrigin.startsWith('http://'),
          allowNavigation: liveHostname ? [liveHostname] : []
        }
      }
    : {})
};

export default config;

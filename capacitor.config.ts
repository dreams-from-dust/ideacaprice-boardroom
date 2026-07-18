import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ideacapriceboardroom.app',
  appName: 'IdeaCaprice',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

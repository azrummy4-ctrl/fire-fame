import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.firefame.app",
  appName: "FireFame",
  webDir: "dist/client",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
    url: "https://fire-fame.lovable.app",
    cleartext: false,
  },
};

export default config;
